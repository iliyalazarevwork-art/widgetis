# Prod e2e / health: защита от schema drift и регрессий после деплоя

**Контекст / incident.** После `task deploy` на prod попал код с `HasUuidV7` в 5 моделях, но миграции БД не перенакатились (строки в `migrations` уже считались применёнными по имени). Результат: модель генерит UUID, `users.id` всё ещё `bigint` → `SQLSTATE[22P02]` на `firstOrCreate` в `GoogleAuthController::callback` → 500 на реальном Google login. 26 prod-smoke тестов в Playwright прошли зелёными, потому что ни один не ходил по пишущему пути — тест №25 дёргал `/auth/google/callback` **без параметров**, Socialite падал с `InvalidStateException` ещё до БД. Нужна многослойная защита, которая не лезет в prod-данные и не требует писать мусорные записи.

## 1. Новый endpoint `GET /api/v1/health/deep` — главный win

**Что проверяет** (в одном запросе, возвращает JSON `{db, redis, schema, migrations, insert_dry_run}`):
- [ ] Ping Postgres (`DB::connection()->getPdo()`)
- [ ] Ping Redis (`Redis::connection()->ping()`)
- [ ] **Schema ↔ model consistency** — для каждой модели из whitelist (`User`, `Site`, `Subscription`, `Order`, `Payment`): если подключён `HasUuidV7` — `information_schema.columns.data_type` колонки `id` обязан быть `uuid`. Иначе — возвращаем `schema: drift` + детали.
- [ ] **Pending migrations** — `Migrator::pendingMigrations()` должен быть пуст.
- [ ] **Dry-run insert в транзакции** — `DB::transaction(fn() => User::create([...valid minimal payload...]) && throw new RollbackNow)`. Это валидирует полный INSERT path (включая типы колонок, cast'ы, default values) **без side effects**. Поймал бы наш uuid/bigint баг мгновенно.
- [ ] Проверка доступа к `storage/logs` — право на запись (был прошлый incident с `auth.log` owned by root).

**Безопасность:**
- [ ] Секретный header `X-Health-Token: <env HEALTH_DEEP_TOKEN>`. Без него endpoint возвращает 404 (не 403 — не палим существование). Токен только в prod, в `.env.production.enc`.
- [ ] Rate limit 10 req/min.
- [ ] Endpoint не попадает в OpenAPI spec и не индексируется.

**Интеграция:**
- [ ] Playwright `prod-smoke.spec.ts` добавляет тест: `GET /health/deep` с токеном → ассертит `{db:"ok", redis:"ok", schema:"ok", migrations:"up-to-date", insert_dry_run:"ok"}`.
- [ ] `deploy.sh` после rolling restart каждого контейнера и **до** переключения Caddy дёргает `/health/deep` на новом контейнере — если red, rollback.

## 2. Dedicated e2e test account + whitelisted master-OTP

Позволяет Playwright реально пройти login-flow и проверить JWT, sessions, `/profile` — без Google OAuth.

- [ ] Seed-only юзер `e2e@widgetis.com` с ролью `customer` (prod-safe seeder, запускается через `deploy:seed-base`).
- [ ] Два env-переменные: `E2E_TEST_EMAIL` + `E2E_MASTER_OTP`. Master code валиден **только** если:
  - email запроса точно равен `E2E_TEST_EMAIL`
  - обе переменные непустые
  - любое расхождение → код считается невалидным, применяются обычные rate limits
- [ ] Жёсткая whitelist: утечка master code без email-match не даёт ничего.
- [ ] Playwright тест: `POST /auth/otp/request` (email=e2e) → `POST /auth/otp/verify` (code=master) → JWT → `GET /api/v1/profile` → `POST /api/v1/auth/logout`. **Никаких write-операций после логина.**
- [ ] Расширить до read-only authenticated smoke: `GET /profile/sites`, `GET /profile/subscription`, `GET /profile/notifications` — проверяют shape и 200, ничего не создают.

## 3. Pre-deploy gate в `deploy.sh`

Вторая линия обороны — ловит drift **до** того как трафик пойдёт на новый контейнер.

- [ ] Новая artisan команда `php artisan schema:verify` — CLI-вариант логики из `/health/deep` без HTTP/транзакций. Возвращает exit code 0/1, пишет red details в stdout.
- [ ] `deploy.sh` после сборки нового backend image и до rolling restart: `docker run --rm new-backend-image php artisan schema:verify` → если red, abort deploy.
- [ ] Флаг `--force-schema` для аварийных случаев (игнорит schema check).

## 4. PHPUnit schema-model consistency test (local / CI)

Основной guard в dev-цикле, гоняется на каждом PR.

- [ ] `tests/Feature/Schema/SchemaModelConsistencyTest.php`:
  - для whitelist моделей проверяет: `HasUuidV7 trait` ↔ `Schema::getColumnType('users','id') === 'uuid'`
  - для FK колонок (`sites.user_id`, `subscriptions.user_id`, и т.д.) — тот же тип что и в родителе
  - fails с чётким сообщением: "User model uses HasUuidV7 but users.id is `bigint` — deploy drift detected"
- [ ] Отдельный test method с inline drift simulation: создаёт `_drift_check_users` с `bigint` PK → запускает детектор → ассертит что drift обнаружен. Доказывает что логика работает, без прода.

## 5. Что НЕ делаем в prod (явный no-list)

Чтобы не забыть и не повторить ошибок:

- [ ] Не лезем в платежи — `/checkout`, monobank, LiqPay никогда не тестируются реальными запросами в prod.
- [ ] Не создаём сайты — внешние API к Horoshop, с побочками.
- [ ] Не эмулируем Google OAuth через SocialiteFake в prod — fake provider в prod контейнере это security hole. Дублирующий INSERT path уже покрыт `/health/deep` dry-run insert.
- [ ] Не тестируем admin-эндпоинты (`/api/v1/admin/*`) с реальным admin токеном в prod.

## 6. Открытые вопросы

- [ ] Есть ли staging/preview environment? Если появится — писать-тесты уедут туда, в prod останутся только health + read-only authenticated smoke.
- [ ] Рассмотреть `/health/basic` (без токена, публичный, только db+redis ping) и `/health/deep` (с токеном, всё остальное) — разделение для мониторинга/uptime services vs внутренних тестов.
- [ ] Интеграция со Sentry/alerting: `/health/deep` red → Slack alert, не ждать пока юзер напишет.

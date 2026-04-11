# TODO

## User SoftDeletes: привести модель и Filament к единому состоянию

**Проблема:** колонка `users.deleted_at` существует в БД (осталась от предыдущей версии модели), но `App\Models\User` **не** использует trait `SoftDeletes`. При этом `app/Filament/Resources/Users/Tables/UsersTable.php` содержит `DeleteBulkAction`, `ForceDeleteBulkAction`, `RestoreBulkAction` — они рассчитаны на soft-delete. Из-за этого:
- `deleted_at` у 8 юзеров был выставлен (был массовый delete), но Laravel-запросы его игнорируют — юзеры продолжают логиниться как «призраки».
- `JWTAuth::fromUser()` и `auth:api` guard пропускают удалённых юзеров.
- Произошла путаница при дебаге Google OAuth: фронтовой баг (`GoogleCallbackPage` не обновлял `AuthContext`) маскировался призрачным состоянием.

**Варианты решения (выбрать один):**

### Вариант A — вернуть SoftDeletes (рекомендуется)
- [ ] Добавить `use Illuminate\Database\Eloquent\SoftDeletes;` + `use SoftDeletes;` в `backend/app/Models/User.php`
- [ ] В `GoogleAuthController::callback` использовать `User::withTrashed()->firstOrCreate(...)` и, если юзер `$user->trashed()`, либо сделать `$user->restore()`, либо вернуть `redirect($frontendUrl . '/login?error=account_deleted')` (по продуктовому решению)
- [ ] В `AuthController::sendOtp` / `verifyOtp` добавить ту же проверку на `trashed()`
- [ ] Убедиться, что `JWTAuth` subject resolver не отдаёт trashed юзеров (при необходимости переопределить `UserProvider`)
- [ ] Прогнать все места, где `User::find()/where()` — где нужны trashed, явно добавить `withTrashed()`
- [ ] Тесты: логин trashed юзера → 401, успешный login не trashed → 200
- [ ] **Data migration**: восстановить `deleted_at = NULL` для реальных аккаунтов, которые попали под массовое удаление (проверить `users.id` 1, 9, 10 перед решением)

### Вариант B — убрать SoftDeletes окончательно
- [ ] Удалить `DeleteBulkAction`, `ForceDeleteBulkAction`, `RestoreBulkAction` из `UsersTable.php`, оставить только обычный `DeleteAction` (hard delete через `UserDeletionService`)
- [ ] Миграция: `Schema::table('users', fn ($t) => $t->dropColumn('deleted_at'));`
- [ ] Убедиться, что `UserDeletionService::delete()` остаётся единственной точкой удаления (уже вызывает hard delete через `$user->delete()` без trait)

**Почему важно:** без выравнивания модели и Filament-экшенов любой клик по «Delete» в админке повторно создаст призраков, и если кто-нибудь позже добавит `SoftDeletes` обратно — все накопленные записи молча исчезнут из выборок.

---

## CDN Proxy Protection
Защитить JS бандлы от кражи конкурентами через приватный R2 + прокси на Laravel.

**Проблема:** бандлы лежат на публичном R2 URL — любой может скачать файл напрямую.

**Решение:**
1. Сделать R2 бакет приватным (отключить Public Access)
2. Прокси-эндпоинт `GET /cdn/sites/{domain}/bundle.js` в Laravel
   - Проверяет заголовок `Referer` — домен должен совпадать с зарегистрированным сайтом
   - Если совпадает → достаёт файл из R2 и отдаёт
   - Если нет → 403 Forbidden
   - Redis кэш TTL ~5 минут
3. Скрипт-тег клиента: `<script src="https://widgetis.com/cdn/sites/{domain}/bundle.js">`

**Что реализовать:**
- [ ] Отключить Public Access на R2 бакете
- [ ] Контроллер `CdnController` с методом `bundle(string $domain)`
- [ ] Маршрут `GET /cdn/sites/{domain}/bundle.js`
- [ ] Redis кэш ключ `cdn:bundle:{domain}`, TTL 300 сек
- [ ] Middleware для проверки Referer заголовка

---

## LiqPay: Подключение подписок и верификация

### Что такое LiqPay
Платёжная система от ПриватБанка. Поддерживает рекурентные платежи (подписки), Visa/Mastercard/Prostir, Google Pay, Apple Pay, Приват24.
Комиссия: **2.75%** с каждого платежа.

### Чеклист для верификации мерчанта

#### 1. ФОП / юрлицо
- [ ] Зарегистрированный ФОП (2-я или 3-я группа) или юрлицо
- [ ] Поточний рахунок (текущий счёт) в **ПриватБанке** — реквизиты для зачислений должны совпадать с рахунком
- [ ] Финансовый номер телефона (привязан к Приват24) — тот же номер используется для регистрации в LiqPay

#### 2. Документы
- [ ] Документы для идентификации (если раньше не проходил в ПриватБанке)
- [ ] Лицензии на регулируемую деятельность (если применимо)
- [ ] Договоры с поставщиками или 1–2 рахунки-фактури на сумму > 5,000 грн (подтверждение деятельности)
- [ ] Документы на интеллектуальную собственность (если продаёте чужой бренд/контент)
- [ ] Публічна оферта (оферта должна быть на имя ФОП, которым зарегистрирована компания в LiqPay)

#### 3. Требования к сайту
- [ ] Работающий сайт с SSL-сертификатом (https)
- [ ] Полное описание товаров/услуг с ценами
- [ ] Информация о поставщике (контакты, юридический адрес)
- [ ] Условия доставки и оплаты
- [ ] Политика возврата
- [ ] Контактные данные: украинский телефон, email, юр. адрес
- [ ] Логотипы платёжных систем (Visa, Mastercard) — желательно в футере
- [ ] Пользовательское соглашение / публичный договор

#### 4. Регистрация в LiqPay
- [ ] Зарегистрироваться на liqpay.ua → "Бізнес" → "Підключити інтернет-еквайрінг"
- [ ] Заполнить анкету: название компании, URL сайта, email, телефон, категория услуг
- [ ] Указать реквизиты банковского счёта
- [ ] Получить **Public Key** и **Private Key** (API ключи)
- [ ] Запросить активацию через поддержку LiqPay

#### 5. Для подписок (рекурентные платежи)
- [ ] Активировать возможность рекурентных платежей (может потребоваться отдельный запрос в поддержку)
- [ ] PCI DSS сертификация **НЕ нужна**, если используешь LiqPay Checkout (перенаправление на страницу LiqPay). Нужна только для server-to-server (ввод карты на своём сайте)
- [ ] API подписки: `action: subscribe`, указать `subscribe_date_start` и `subscribe_periodicity` (month/year)
- [ ] API отписки: `action: unsubscribe` для отмены подписки

### Сроки
- Регистрация: ~15 минут
- Проверка магазина: до 24 часов
- Активация: 2–4 часа после одобрения

### Контакты поддержки
- Email: technical.support@liqpay.ua
- Телефон: 3700 (бесплатно с мобильного)
- Адрес: Київ, вул. Грушевського 1Д

### Источники
- [Условия и правила LiqPay](https://www.liqpay.ua/information/terms)
- [Требования к мерчанту](https://www.liqpay.ua/information/requirements)
- [Документация API подписки](https://www.liqpay.ua/doc/api/internet_acquiring/subscription)
- [Верификация](https://www.liqpay.ua/doc/api/confirmation)
- [Довідник питань](https://www.liqpay.ua/information/handbook)
- [Подключение через ПриватБанк](https://privatbank.ua/business/business-connect-liqpay)
- [Тарифы LiqPay](https://banki.ua/internet-acquiring/liqpay)
- [Опыт подключения (Morkva)](https://morkva.co.ua/liqpay-dlia-internet-mahazynu-dosvid-pidkliuchennia/)


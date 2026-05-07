# Deployment Guide — Widgetis

## Быстрый старт

```bash
task deploy           # полный деплой (push + build + migrate + cache)
task deploy:fast      # деплой без пересборки образов (только код/конфиг)
task deploy:seed-base # деплой + только безопасные прод-сидеры (без демо/админа)
```

---

## Архитектура

```
Пользователь
     │ :80 / :443
     ▼
 [nginx]  ← обратный прокси
  ├── /api/*         → backend:8000   (Laravel)
  ├── /auth/*        → backend:8000
  ├── /site/*        → backend:8000
  ├── /_widget/*     → backend:8000
  ├── /build/*       → widget-builder:3200
  ├── /modules/*     → widget-builder:3200
  └── /*             → frontend:80    (React SPA, nginx static)

backend   ← PHP 8.4 + Laravel 12
postgres  ← PostgreSQL 15 (volume: pgdata)
redis     ← Redis 7 (volume: redisdata)
queue-worker ← php artisan queue:work
scheduler    ← php artisan schedule:run (loop 60s)
```

**Сервер:** `root@204.168.206.10`
**Директория:** `/opt/widgetis`
**Репозиторий:** `git@github.com:iliyalazarevwork-art/widgetis.git`

---

## Первый деплой на новый сервер

### 1. Установить Docker

```bash
ssh root@YOUR_SERVER
curl -fsSL https://get.docker.com | sh
```

### 2. Клонировать репозиторий

```bash
mkdir -p /opt/widgetis
git clone https://github.com/iliyalazarevwork-art/widgetis.git /opt/widgetis
cd /opt/widgetis
```

### 3. Создать `.env.prod` (docker-compose переменные)

```bash
cat > /opt/widgetis/.env.prod << 'EOF'
DB_PASSWORD=<STRONG_RANDOM_PASSWORD>
REDIS_PASSWORD=<STRONG_RANDOM_PASSWORD>
EOF
```

Сгенерировать пароли:
```bash
openssl rand -hex 24   # для DB_PASSWORD
openssl rand -hex 24   # для REDIS_PASSWORD
```

### 4. Создать `backend/.env`

```bash
cp backend/.env.production backend/.env
```

Заполнить значения (описание ниже в разделе "Переменные").

Сгенерировать ключи:
```bash
# APP_KEY
docker run --rm php:8.4-cli php -r "echo 'base64:' . base64_encode(random_bytes(32)) . PHP_EOL;"

# JWT_SECRET
openssl rand -hex 32
```

### 5. Запустить

```bash
DOCKER_BUILDKIT=1 docker compose -f docker-compose.prod.yml --env-file .env.prod build
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T backend php artisan migrate --force
docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T backend php artisan db:seed --class=ProductionBootstrapSeeder --force
```

---

## Обычный деплой (из рабочей машины)

```bash
task deploy
```

Что происходит внутри `task deploy` → `deploy.sh`:

1. `git push origin main` — пушим код на GitHub
2. `ssh root@204.168.206.10` — заходим на сервер
3. `git pull origin main` — на сервере тянем обновления
4. `docker compose build` — пересобираем образы (frontend + backend)
5. `docker compose up -d` — поднимаем контейнеры
6. `php artisan down --retry=60` — переводим приложение в maintenance mode, чтобы во время деплоя не отдавать 500
7. `php artisan migrate --force` — запускаем новые миграции
8. (опционально) `php artisan db:seed --class=ProductionBootstrapSeeder --force` — только если передан `--seed-base`
9. `php artisan {config,route,view,event}:cache` — прогреваем кэш
10. Перезапускаем `queue-worker` и `scheduler`
11. `php artisan up` — возвращаем приложение в работу

Важно: `route:cache` требует, чтобы в маршрутах не было closure-роутов. Для простых JSON-эндпоинтов и health-check лучше использовать контроллеры или `Route::view()`.

### Флаги

```bash
task deploy                    # полный деплой
task deploy:fast               # без docker build (если менялся только PHP/JS код через volume)
task deploy:seed-base          # деплой + только безопасные сиды
bash deploy.sh --local         # запустить прямо на сервере (без SSH)
bash deploy.sh --skip-build    # не пересобирать образы
bash deploy.sh --skip-migrate  # не запускать миграции
bash deploy.sh --seed-base     # запустить только безопасные сиды (без демо/админа)
```

---

## Безопасность — как устроены секреты

**Правило:** секреты никогда не попадают в git.

| Файл | Где живёт | Что содержит |
|------|-----------|-------------|
| `backend/.env` | только на сервере `/opt/widgetis/backend/.env` | APP_KEY, JWT_SECRET, DB_PASSWORD, REDIS_*, R2_*, RESEND_API_KEY, LIQPAY_*, GOOGLE_* |
| `.env.prod` | только на сервере `/opt/widgetis/.env.prod` | DB_PASSWORD, REDIS_PASSWORD (для postgres/redis контейнеров) |

Оба файла в `.gitignore`. При `git pull` они не перезаписываются.

---

## Переменные окружения

### Обязательные (заполнить при первом деплое)

| Переменная | Где взять |
|-----------|-----------|
| `APP_KEY` | `docker run --rm php:8.4-cli php -r "echo 'base64:'.base64_encode(random_bytes(32)).PHP_EOL;"` |
| `JWT_SECRET` | `openssl rand -hex 32` |
| `DB_PASSWORD` | `openssl rand -hex 24` (одинаковый в `.env.prod` и `backend/.env`) |
| `REDIS_PASSWORD` | `openssl rand -hex 24` (одинаковый в `.env.prod` и `backend/.env`) |
| `RESEND_API_KEY` | https://resend.com → API Keys |
| `R2_ACCESS_KEY_ID` | Cloudflare → R2 → Manage R2 API tokens |
| `R2_SECRET_ACCESS_KEY` | то же |
| `R2_ENDPOINT` | `https://<account_id>.r2.cloudflarestorage.com` |
| `LIQPAY_PUBLIC_KEY` | https://liqpay.ua → Business → API |
| `LIQPAY_PRIVATE_KEY` | то же |
| `GOOGLE_CLIENT_ID` | https://console.cloud.google.com → OAuth |
| `GOOGLE_CLIENT_SECRET` | то же |

---

## DNS настройка

Добавить в панели DNS-провайдера:

| Тип | Имя | Значение |
|-----|-----|----------|
| `A` | `@` | `204.168.206.10` |
| `A` | `www` | `204.168.206.10` |
| `CNAME` | `cdn` | `pub-0e965c30b5074172b763a87cee02e5bf.r2.dev` |

После настройки `cdn.widgetis.com` — поменять в `backend/.env`:
```
R2_PUBLIC_URL=https://cdn.widgetis.com
```

---

## SSL (HTTPS)

После того как DNS распространится (5-30 мин):

```bash
ssh root@204.168.206.10

# Получить сертификат
docker compose -f /opt/widgetis/docker-compose.prod.yml --env-file .env.prod \
  --profile ssl run certbot certonly --webroot \
  -w /var/www/certbot -d widgetis.com -d www.widgetis.com \
  --email admin@widgetis.com --agree-tos --no-eff-email
```

Затем раскомментировать HTTPS-блок в `nginx/nginx.conf`, закоммитить и задеплоить:

```bash
# раскомментировать server { listen 443... } блок в nginx/nginx.conf
task deploy:fast
```

Авто-обновление сертификата работает через `certbot` контейнер с профилем `ssl`.

---

## Полезные команды

```bash
# Статус на сервере
task prod:logs          # логи бэкенда
ssh root@204.168.206.10 "cd /opt/widgetis && docker compose -f docker-compose.prod.yml --env-file .env.prod ps"

# Artisan на сервере
task prod:artisan -- migrate:status
task prod:artisan -- queue:failed

# Shell в контейнере
task prod:sh

# Бэкап базы
ssh root@204.168.206.10 "
  cd /opt/widgetis &&
  docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T postgres \
    pg_dump -U widgetis widgetis | gzip > backups/db-\$(date +%Y%m%d-%H%M%S).sql.gz
"
```

---

## SEO-prerender — обязательный шаг перед `task deploy`

Фронт собирается **локально** (не в Docker) — через `npm run build:prerender`. Готовый `frontend/dist/` коммитится в git, на сервере nginx-контейнер просто отдаёт его как есть.

**Зачем prerender:** ~32 публичные страницы (главная, /widgets, /pricing, /cases, /widgets/{slug} × 20, юридические) рендерятся через headless Chromium и сохраняются как статические HTML в `dist/<route>/index.html`. Google видит полный HTML с meta-тегами, Product schema и BreadcrumbList сразу, без ожидания JS-рендеринга. Sitemap.xml тоже генерируется динамически из API.

### Workflow

Prerender запускается **автоматически** в `task deploy` (Phase C в `deploy:pre`). Ничего вручную делать не нужно — `task deploy` сам:

1. Проверки кода (pint, eslint, phpstan, tsc, phpunit, vitest) — Phase A+B
2. Запускает `npm run build:prerender` против `https://api.widgetis.com` — Phase C
3. Если `frontend/dist/` или sitemap изменились — auto-commit `chore(frontend): rebuild dist [auto-prerender]`
4. Дальше обычный поток: бэкап БД → push → ssh → docker build → up

**Время prerender:** ~15–20 секунд на 32 страницы.

### Если хочешь использовать локальный backend вместо prod API

```bash
PRERENDER_BACKEND_URL=http://127.0.0.1:9001 task deploy
```

### Ручной запуск prerender (без деплоя)

```bash
cd frontend
BACKEND_URL=http://127.0.0.1:9001 npm run build:prerender
```

### Скрипты

- `frontend/scripts/build-routes.mjs` — тянет список виджетов из `BACKEND_URL/api/v1/products`, fallback на `widget-slugs.ts`.
- `frontend/scripts/generate-sitemap.mjs` — пишет `dist/sitemap.xml` и `public/sitemap.xml`.
- `frontend/scripts/prerender.mjs` — поднимает локальный HTTP-сервер на `dist/`, проксирует `/api/*` на `BACKEND_URL`, обходит маршруты Playwright'ом, сохраняет HTML.

### Что в Docker

`frontend/Dockerfile` теперь однослойный — просто nginx, который копирует `dist/`. Никакого vite, npm, playwright. Прод-билд занимает ~5 секунд.

### Если забыл сделать prerender

Задеплоится **старый** `dist/` из последнего коммита. Контента не пропадёт, но новые виджеты/страницы не попадут в HTML. Нужно повторить workflow и сделать новый деплой.

---

## Откат

```bash
ssh root@204.168.206.10 "
  cd /opt/widgetis &&
  git log --oneline -5   # посмотреть коммиты
  git checkout <commit>  # откатиться
  bash deploy.sh --local --skip-migrate
"
```

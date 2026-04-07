# Step 01 — Project Initialization

## Goal
A brand new Laravel 12 project in its own directory with its own GitHub repository.
Docker environment with PostgreSQL and Redis. Everything works, `php artisan` responds,
initial commit is pushed to GitHub.

**This is a completely separate project from the old codebase. Own folder, own git, own repo.**

## Actions

### 1. Create GitHub repository

```bash
gh repo create lazarevrollun/widgetis-backend \
  --private \
  --description "Widgetis backend API — Laravel 12 + Filament 5 + JWT"
```

### 2. Create project directory and Laravel project

```bash
mkdir -p /Users/iliya/Documents/work/phpStormProjects/iliya/widgetis-backend
cd /Users/iliya/Documents/work/phpStormProjects/iliya

docker run --rm -v $(pwd)/widgetis-backend:/app -w /app composer:latest \
  composer create-project laravel/laravel . "^12.0"
```

From this point forward, the project root is:
```
/Users/iliya/Documents/work/phpStormProjects/iliya/widgetis-backend/
```

**All commands below assume you are in this directory.**

### 3. Initialize git and connect to GitHub

```bash
cd /Users/iliya/Documents/work/phpStormProjects/iliya/widgetis-backend
git init
git remote add origin git@github.com:lazarevrollun/widgetis-backend.git
```

### 4. Create .gitignore

Replace `.gitignore` with:

```gitignore
/vendor/
/node_modules/
/.env
/.env.backup
/.env.production
/storage/*.key
/storage/logs/*
!/storage/logs/.gitkeep
/storage/framework/cache/data/*
!/storage/framework/cache/data/.gitkeep
/public/hot
/public/storage
/bootstrap/cache/*
!/bootstrap/cache/.gitkeep
/.phpunit.result.cache
/.idea/
/.vscode/
*.swp
*.swo
.DS_Store
Thumbs.db
docker-compose.override.yml
```

### 5. Create docker-compose.dev.yml

```yaml
services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      - .:/var/www/html
    ports:
      - "9002:9000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    environment:
      APP_ENV: local
    networks:
      - widgetis

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: widgetis
      POSTGRES_USER: widgetis
      POSTGRES_PASSWORD: widgetis_secret
    ports:
      - "5434:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U widgetis"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - widgetis

  redis:
    image: redis:7-alpine
    ports:
      - "6381:6379"
    networks:
      - widgetis

volumes:
  pgdata:

networks:
  widgetis:
    driver: bridge
```

### 6. Create Dockerfile

```dockerfile
FROM php:8.3-fpm-alpine

RUN apk add --no-cache \
    postgresql-dev \
    icu-dev \
    libzip-dev \
    linux-headers \
    && docker-php-ext-install \
    pdo_pgsql \
    intl \
    zip \
    bcmath \
    opcache

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY composer.json composer.lock ./
RUN composer install --no-interaction --no-dev --optimize-autoloader --no-scripts 2>/dev/null || true

COPY . .

RUN chown -R www-data:www-data storage bootstrap/cache

EXPOSE 9000

CMD ["php-fpm"]
```

### 7. Create .env and .env.example

**`.env`**:
```env
APP_NAME=Widgetis
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:9002

LOG_CHANNEL=stack
LOG_STACK=daily
LOG_LEVEL=debug

DB_CONNECTION=pgsql
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=widgetis
DB_USERNAME=widgetis
DB_PASSWORD=widgetis_secret

CACHE_STORE=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

REDIS_HOST=redis
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=log

JWT_SECRET=

R2_PUBLIC_URL=https://cdn.widgetis.com
```

**`.env.example`** — identical but with generic `DB_PASSWORD=secret` and empty `JWT_SECRET=`.

### 8. Create .editorconfig

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
indent_size = 4
indent_style = space
insert_final_newline = true
trim_trailing_whitespace = true

[*.{yml,yaml}]
indent_size = 2

[*.md]
trim_trailing_whitespace = false
```

### 9. Build, install, and start

```bash
docker compose -f docker-compose.dev.yml up -d --build
docker compose -f docker-compose.dev.yml exec backend composer install
docker compose -f docker-compose.dev.yml exec backend php artisan key:generate
docker compose -f docker-compose.dev.yml exec backend php artisan migrate
```

### 9.1. Install dev quality tools

```bash
docker compose -f docker-compose.dev.yml exec backend composer require --dev \
  larastan/larastan:^3.0 \
  laravel/pint:^1.13
```

Create `phpstan.neon` in project root:

```neon
includes:
    - vendor/larastan/larastan/extension.neon

parameters:
    paths:
        - app/
    level: 6
    checkMissingIterableValueType: false
```

Create `pint.json` in project root:

```json
{
    "preset": "psr12",
    "rules": {
        "declare_strict_types": true,
        "ordered_imports": {
            "sort_algorithm": "alpha"
        },
        "no_unused_imports": true,
        "single_quote": true,
        "trailing_comma_in_multiline": true
    }
}
```

Verify they work:

```bash
docker compose -f docker-compose.dev.yml exec backend ./vendor/bin/pint --test
docker compose -f docker-compose.dev.yml exec backend ./vendor/bin/phpstan analyse --memory-limit=512M
```

### 10. Initial commit and push

```bash
git add -A
git commit -m "chore: init Laravel 12 project with Docker, PostgreSQL, Redis"
git branch -M main
git push -u origin main
```

## How to Verify

```bash
# Laravel responds
docker compose -f docker-compose.dev.yml exec backend php artisan --version
# Expected: Laravel Framework 12.x.x

# Database is connected
docker compose -f docker-compose.dev.yml exec backend php artisan db:show
# Expected: PostgreSQL connection info, database "widgetis"

# Redis is connected
docker compose -f docker-compose.dev.yml exec backend php artisan tinker \
  --execute="echo cache()->store('redis')->put('test', 'ok', 60) ? 'Redis OK' : 'Redis FAIL';"
# Expected: Redis OK

# GitHub repo exists and has the commit
gh repo view lazarevrollun/widgetis-backend --json name,defaultBranchRef
git log --oneline -1
```

## Commit
Already done in step 10.

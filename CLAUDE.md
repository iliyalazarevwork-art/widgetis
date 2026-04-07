# Widgetis Backend

## What is this

Widgetis — a widget marketplace for e-commerce stores on Horoshop.
This is the backend API built with Laravel 12, Filament 5, JWT auth.

Business model: subscription plans (Free / Basic / Pro / Max).
No one-time payments. No cart. Subscriptions only.

## How to build this project

### Step 1: Read the guide

Open `docs/ai-dev-guide/00-overview.md` — it has the full table of contents.
Execute each step file **in order** (01 → 18). **Do NOT skip steps.**

Each step has:
- **Goal** — what must work after this step
- **Prerequisites** — what must be done before
- **Actions** — exact code to write, with full file contents
- **How to Verify** — commands to confirm it works
- **Commit** — commit message to use

### Step 2: Reference the full plan

`docs/v2-backend-plan.md` is the comprehensive backend plan with:
- All 80+ API endpoints with request/response schemas
- Full database schema (26 tables)
- Service architecture (15 services)
- Email templates, cron jobs, middleware

Use it as a reference when the step guide says "follow the same pattern."

## Rules

### Docker — always

All commands run inside Docker. Never run `php`, `composer`, `npm` on the host:

```bash
docker compose -f docker-compose.dev.yml exec backend php artisan <command>
docker compose -f docker-compose.dev.yml exec backend composer <command>
```

### Code quality

- `declare(strict_types=1);` in every PHP file
- PHP 8.3 features: enums, readonly, match, named arguments
- Type hints on all parameters, return types, and properties
- PSR-12 formatting (enforce with `./vendor/bin/pint`)
- Use PHP enums for all status/type columns — never compare against raw strings
- Use `$model->status === StatusEnum::Active` not `$model->status === 'active'`

### Self-check after writing code

After writing any PHP code, run these checks before committing:

```bash
# 1. Code style (auto-fix)
docker compose -f docker-compose.dev.yml exec backend ./vendor/bin/pint

# 2. Static analysis (catch type errors, missing imports, wrong method calls)
docker compose -f docker-compose.dev.yml exec backend ./vendor/bin/phpstan analyse --memory-limit=512M

# 3. Tests
docker compose -f docker-compose.dev.yml exec backend php artisan test
```

Fix any issues found before committing. Do NOT commit code that fails phpstan or tests.

### API conventions

- Prefix: `/api/v1/`
- Customer routes: `/api/v1/profile/...` (NOT `/me/`)
- Admin routes: `/api/v1/admin/...`
- Responses: always JSON
- Pagination: `{ data: [], meta: { current_page, last_page, per_page, total } }`
- Errors: `{ error: { code: "VALIDATION_ERROR", message: "...", details: {} } }`

### Language

- Code, comments, git messages: English
- API responses: depend on `Accept-Language` header (uk or en)
- Database: slugs and enums in English. Translations in jsonb: `{"en": "...", "uk": "..."}`

### Commits

After each step — commit and push:

```bash
git add -A
git commit -m "feat: <what was done>"
git push origin main
```

Use conventional prefixes: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`

### Logging

Use standard Laravel logger. Separate channels for auth and payments:
- `Log::channel('auth')->info(...)` for auth events
- `Log::channel('payments')->info(...)` for payment/subscription events
- `Log::error(...)` for unexpected errors

## Tech stack (verified, 0 conflicts)

| Package | Version |
|---------|---------|
| `laravel/framework` | 12.x |
| `filament/filament` | 5.x |
| `tymon/jwt-auth` | 2.3.x |
| `spatie/laravel-permission` | 7.x |
| `spatie/laravel-settings` | 3.7.x |
| `spatie/laravel-translatable` | 6.x |
| `spatie/laravel-data` | 4.x |
| `laravel/socialite` | 5.x |
| `resend/resend-laravel` | 1.3.x |
| `laravel/vonage-notification-channel` | 3.x |
| `predis/predis` | 3.4.x |
| `league/flysystem-aws-s3-v3` | 3.x |
| `ensi/laravel-openapi-server-generator` | 4.x (dev) |
| PostgreSQL | 15 |
| Redis | 7 |

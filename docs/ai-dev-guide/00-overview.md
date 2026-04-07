# Widgetis Backend v2 — AI Developer Guide

## What This Is

A step-by-step guide for an AI agent building the Widgetis backend from scratch.
Each step is a separate file. Execute them **strictly in order**. Do not skip ahead.

## Where to Work

This is a **completely new project** in its own directory with its own GitHub repo.
It has NOTHING to do with the old codebase structurally — different folder, different git history.

```
/Users/iliya/Documents/work/phpStormProjects/iliya/
├── service-catalog-refactor/   ← OLD project (DO NOT TOUCH)
│   └── docs/ai-dev-guide/      ← this documentation lives here for reference
└── widgetis-backend/            ← NEW project (we work here)
    ├── app/
    ├── docker-compose.dev.yml
    ├── Dockerfile
    └── ...
```

**GitHub repo:** `lazarevrollun/widgetis-backend`
**Project root:** `/Users/iliya/Documents/work/phpStormProjects/iliya/widgetis-backend/`

## Execution Order

| Step | File | What We Do |
|------|------|-----------|
| 01 | `01-project-init.md` | New GitHub repo, fresh Laravel 12, Docker, .env |
| 02 | `02-enums.md` | All PHP enums (statuses, types, roles) |
| 03 | `03-database.md` | PostgreSQL, Redis, all 26 migrations |
| 04 | `04-auth-jwt.md` | JWT authentication, OTP service, middleware |
| 05 | `05-user-model.md` | User model, roles, Spatie Permission |
| 06 | `06-api-foundation.md` | Base controllers, responses, error handling |
| 07 | `07-logging.md` | Structured logging |
| 08 | `08-localization.md` | Multi-language support (uk/en), translatable |
| 09 | `09-settings.md` | Spatie Settings, public API |
| 10 | `10-plans-and-products.md` | Plans, Products, Tags models + API |
| 11 | `11-subscriptions.md` | Subscriptions, trial, lifecycle |
| 12 | `12-sites.md` | Sites, scripts, verification |
| 13 | `13-profile-api.md` | User dashboard (/profile/*) |
| 14 | `14-admin-api.md` | Admin API (/admin/*) |
| 15 | `15-notifications.md` | Notifications |
| 16 | `16-filament.md` | Filament admin panel |
| 17 | `17-cron-jobs.md` | Scheduled tasks |
| 18 | `18-openapi.md` | OpenAPI specification |

## General Rules for the AI Agent

### Commits
After each step — commit with a conventional prefix and push:
```
feat: add JWT authentication with OTP login and core middleware
feat: add User model with Spatie roles
```
Always push to the remote after each commit:
```bash
git push origin main
```

### Testing
Each step includes a "How to Verify" section. Run the verification before committing.

### Docker
Execute EVERYTHING through Docker. No `php artisan` or `composer` on the host:
```bash
docker compose -f docker-compose.dev.yml exec backend php artisan <command>
docker compose -f docker-compose.dev.yml exec backend composer <command>
```

### Code Style
- **PSR-12** formatting
- **PHP 8.3** features: enums, readonly, named args, match, first-class callables
- `declare(strict_types=1);` in **every** PHP file
- Type hints on **all** parameters, return types, and properties
- Use **PHP enums** for all status/type fields — never raw strings in business logic
- **No magic strings** — reference `EnumName::Value` everywhere

### Enum Convention
Every database column that represents a status, type, or fixed set of values
MUST have a corresponding PHP enum in `app/Enums/`. The Eloquent model MUST
cast that column to the enum. Business logic MUST compare against enum cases,
never raw strings.

```php
// CORRECT:
$subscription->status === SubscriptionStatus::Active

// WRONG:
$subscription->status === 'active'
```

### API Conventions
- Prefix: `/api/v1/`
- Customer routes: `/api/v1/profile/...` (NOT `/me/`)
- Admin routes: `/api/v1/admin/...`
- Public routes: `/api/v1/...`
- Auth routes: `/api/v1/auth/...`
- Responses: always JSON
- Pagination: `{ data: [], meta: { current_page, last_page, per_page, total } }`
- Errors: `{ error: { code: "VALIDATION_ERROR", message: "...", details: {} } }`

### Language
- Code, comments, git: English
- API responses: depend on `Accept-Language` header (uk/en)
- Database data: in English (slugs, enums). Translations in jsonb: `{"en": "...", "uk": "..."}`

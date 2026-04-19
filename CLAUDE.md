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

## Step workflow

At every step boundary follow this order — do NOT skip any part:

1. **Before starting a step** — recommend which model (`opus` / `sonnet` / `haiku`) is best suited for the upcoming work so the user can switch if needed.
2. **After completing a step** — run `git commit` with a conventional commit message (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`).
3. **After committing** — launch subagents to review the completed work across:
   - Code quality & style
   - Security vulnerabilities
   - Bugs & logic errors
   - Architecture & structure analysis

   Choose the effort level (`quick` / `medium` / `very thorough`) **independently** for each subagent based on complexity and risk:
   - Simple infrastructure / config steps → `quick`
   - Auth / payments / security steps → `very thorough`

## Frontend Design Standards

**All frontend work MUST follow [`frontend/DESIGN-STANDARDS.md`](frontend/DESIGN-STANDARDS.md).**

This file defines: colors, typography, icons, plan data, layout rules (header/footer on every page), back button, contacts from API, widget icon mapping, CSS conventions, and component reuse rules.

Before writing or modifying any frontend component — read and follow this file. Design (Pencil) is the source of truth.

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

### OOP design rules

**Every class must be either `final` or `abstract` — never neither.**
- `final` by default: prevents unintended inheritance, forces composition, protects invariants.
- `abstract` only when you deliberately design an extension point.
- Never leave a class "open" by accident.

**Composition over inheritance.**
Inject collaborators via constructor. Extending a concrete class couples you to its implementation; injecting an interface lets you swap at the container level.

**Depend on interfaces, not concrete classes.**
Every constructor parameter should be type-hinted against an interface. This enforces Dependency Inversion and makes unit-testing trivial.

**DTOs and value objects must be `readonly`.**
Use `readonly class` + named constructors (`::fromRequest()`, `::fromModel()`). Immutable data cannot be mutated by accident; named constructors encode intent.

```php
final readonly class CreateSiteData
{
    private function __construct(
        public string $url,
        public string $name,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(url: $request->string('url'), name: $request->string('name'));
    }
}
```

**Guard clauses first — no deep nesting.**
Validate preconditions at the top of every method and return/throw immediately. The happy path should be flat and unindented.

```php
// Bad
public function activate(User $user): void {
    if ($user->isActive()) {
        if ($user->hasSubscription()) {
            // ... 4 levels deep
        }
    }
}

// Good
public function activate(User $user): void {
    if (! $user->isActive()) {
        throw new DomainException('User is not active');
    }
    if (! $user->hasSubscription()) {
        throw new DomainException('No subscription');
    }
    // happy path here
}
```

**Never return `null` — throw or use typed alternatives.**
A `null` return forces every caller to add `null` checks. Instead: throw a domain exception, return a Null Object, or use `?Type` only when `null` has explicit semantic meaning (e.g. "not set yet").

**No base classes for parallel hierarchies — extract a service instead.**
If `ListenerA` and `ListenerB` share logic, put it in an injected service, not a `BaseListener`. Base classes create invisible coupling; services are explicit dependencies.

### Principles: SOLID, DRY, KISS

**SOLID** — apply at every class and method boundary:
- **S** — Single Responsibility: one class, one reason to change. A `SubscriptionService` activates subscriptions; it does not send emails.
- **O** — Open/Closed: extend behaviour via new classes (strategies, decorators), not by editing existing ones.
- **L** — Liskov Substitution: any subtype must be substitutable for its parent without breaking callers. Prefer `final` to avoid violating this by accident.
- **I** — Interface Segregation: small focused interfaces (`CanBeCancelled`, `HasTrialPeriod`) over one fat `SubscriptionInterface`.
- **D** — Dependency Inversion: high-level modules depend on abstractions, not on concrete classes. Wire everything through the IoC container.

**DRY — Don't Repeat Yourself.**
Every piece of knowledge must have a single authoritative source. If the same logic appears twice — extract it to a method, service, or value object. Duplication of code leads to divergence: one copy gets fixed, the other doesn't.

**KISS — Keep It Simple, Stupid.**
Prefer the simplest solution that works. No speculative abstractions, no "we might need this later" layers. A plain method beats a pattern when there is only one use case. Complexity is a cost; always justify it.

### Constants and enums

**Use constants and enums — never magic strings or numbers.**
- Use a PHP `enum` for any value that belongs to a closed set (statuses, types, roles).
- Use a `class constant` for fixed scalar values (timeouts, limits, config keys).
- Never hardcode a raw string or integer more than once — name it.

```php
// Bad
if ($plan === 'pro') { ... }
Cache::put('settings', $data, 300);

// Good
if ($plan === PlanSlug::Pro) { ... }
Cache::put('settings', $data, CacheTtl::SETTINGS);
```

### Testing

**Write tests for every feature — feature tests by default.**
- Use **Pest** (Laravel 12 default). PHPUnit only when Pest lacks the capability.
- Default to **feature tests** (full HTTP + DB stack). Drop to unit tests only for pure logic with no infrastructure.
- Test names must read as plain English sentences: `it('returns 422 when email is missing')`.
- One test — one assertion of behaviour. Don't test implementation details, test outcomes.
- Tests live in `tests/Feature/` (HTTP flows) and `tests/Unit/` (pure classes).

### More OOP rules

**Tell, Don't Ask.**
Don't read an object's state externally and then decide what to do. Tell the object to do it.
```php
// Bad — asking
if ($subscription->getStatus() === 'active') { $subscription->setStatus('cancelled'); }
// Good — telling
$subscription->cancel();
```

**Command-Query Separation (CQS).**
A method either mutates state (`void`) OR returns data — never both. If you need an ID after creation, query it separately.

**Short methods — one level of abstraction.**
Keep methods under ~15 lines. If a block needs a comment to explain it, extract it into a named private method.

**No static methods for business logic.**
Static calls cannot be injected, swapped, or mocked. The only allowed statics are named constructors on value objects (`public static function fromRequest(): self`).

**Explicit domain exceptions — never throw `\Exception`.**
Every `throw` must use a specific named class (`SubscriptionAlreadyCancelledException`). Generic exceptions communicate nothing; named exceptions are typed, monitorable, and PHPStan-analysable.

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

## Site-proxy service

`services/site-proxy/server.mjs` — Node.js HTTP proxy that fetches any external website and serves it through the Widgetis backend. Used to preview a customer's Horoshop store with demo widgets injected inline.

**Port:** `3100` (env `PORT`)

**Usage:**
```
GET /site/{domain}/path   — fetch and proxy that domain
GET /path                 — implicit: reuse the last domain from the visitor session
```

**What it does:**
- Rewrites all HTML links/forms/assets to go through `/site/{domain}/`
- Injects `demo-bundle.js` (from `DEMO_BUNDLE_PATH`) as an inline `<script>` on every HTML response
- Injects a runtime XHR/fetch patch so in-page JS requests are also proxied
- Maintains a per-visitor cookie jar (keyed by `wgts_pv` cookie) with 1 h TTL
- LRU response cache: HTML 60 s · text assets 1 h · binary assets 24 h (max 5 000 entries)
- Handles Horoshop bot-challenge (`challenge_passed` cookie) automatically
- Returns a friendly fallback page for Cloudflare-protected or 403/503 sites

**SSRF protection** — blocked targets:
- Raw IPv4/IPv6 addresses
- `localhost`, `*.localhost`, `.local`, `.internal`, `.test`, `.invalid`, `.example`
- `169.254.*` (link-local) and `metadata.google.internal`

**Demo bundle path** (default): `./public/demo-bundle.js` — override via `DEMO_BUNDLE_PATH` env var.

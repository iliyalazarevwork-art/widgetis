# Step 06 — Structured Logging

## Goal
Structured JSON logging for production. Readable logging for development.
Key events (auth, payments, errors) are logged consistently.

## Prerequisites
Steps 01–05 completed.

## Actions

### 1. Configure logging channels

Edit `config/logging.php`:

```php
'channels' => [
    'stack' => [
        'driver' => 'stack',
        'channels' => explode(',', env('LOG_STACK', 'daily')),
        'ignore_exceptions' => false,
    ],

    'daily' => [
        'driver' => 'daily',
        'path' => storage_path('logs/laravel.log'),
        'level' => env('LOG_LEVEL', 'debug'),
        'days' => env('LOG_DAILY_DAYS', 14),
        'replace_placeholders' => true,
    ],

    'stderr' => [
        'driver' => 'monolog',
        'level' => env('LOG_LEVEL', 'debug'),
        'handler' => \Monolog\Handler\StreamHandler::class,
        'formatter' => \Monolog\Formatter\JsonFormatter::class,
        'with' => [
            'stream' => 'php://stderr',
        ],
    ],

    'auth' => [
        'driver' => 'daily',
        'path' => storage_path('logs/auth.log'),
        'level' => 'info',
        'days' => 30,
    ],

    'payments' => [
        'driver' => 'daily',
        'path' => storage_path('logs/payments.log'),
        'level' => 'info',
        'days' => 90,
    ],
],
```

### 2. Add to `.env`

```env
LOG_CHANNEL=stack
LOG_STACK=daily
LOG_LEVEL=debug
LOG_DAILY_DAYS=14
```

For production, use:
```env
LOG_CHANNEL=stack
LOG_STACK=daily,stderr
LOG_LEVEL=info
```

### 3. Create logging helper trait

**`app/Http/Traits/LogsActivity.php`**
```php
<?php

declare(strict_types=1);

namespace App\Http\Traits;

use Illuminate\Support\Facades\Log;

trait LogsActivity
{
    protected function logAuth(string $event, array $context = []): void
    {
        Log::channel('auth')->info($event, array_merge([
            'ip' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ], $context));
    }

    protected function logPayment(string $event, array $context = []): void
    {
        Log::channel('payments')->info($event, $context);
    }
}
```

### 4. Add auth logging to AuthController

Edit `AuthController` — add `use LogsActivity;` and log key events:

```php
use App\Http\Traits\LogsActivity;

class AuthController extends BaseController
{
    use LogsActivity;

    // In sendOtp():
    $this->logAuth('otp.sent', ['email' => $request->validated('email')]);

    // In verifyOtp() on success:
    $this->logAuth('otp.verified', ['email' => $email, 'user_id' => $user->id, 'new_user' => $user->wasRecentlyCreated]);

    // In verifyOtp() on failure:
    $this->logAuth('otp.failed', ['email' => $email]);

    // In logout():
    $this->logAuth('logout', ['user_id' => $this->currentUser()->id]);
}
```

### 5. Add request logging middleware (optional, for dev)

**`app/Http/Middleware/LogApiRequests.php`**
```php
<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class LogApiRequests
{
    public function handle(Request $request, Closure $next): Response
    {
        $start = microtime(true);

        $response = $next($request);

        $duration = round((microtime(true) - $start) * 1000, 2);

        if (app()->environment('local')) {
            Log::debug('API Request', [
                'method' => $request->method(),
                'url' => $request->fullUrl(),
                'status' => $response->getStatusCode(),
                'duration_ms' => $duration,
                'user_id' => $request->user()?->id,
            ]);
        }

        return $response;
    }
}
```

Register in `bootstrap/app.php` API middleware (only if you want it active by default in dev):
```php
$middleware->api(prepend: [
    ForceJsonResponse::class,
    SecurityHeaders::class,
    SetLocale::class,
    LogApiRequests::class, // add this
]);
```

## How to Verify

```bash
# 1. Trigger an OTP send
curl -X POST http://localhost:9002/api/v1/auth/otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# 2. Check auth log exists and has the event
docker compose -f docker-compose.dev.yml exec backend cat storage/logs/auth.log | tail -5
# Should contain: "otp.sent" with email and IP

# 3. Check main log has API request
docker compose -f docker-compose.dev.yml exec backend cat storage/logs/laravel.log | tail -5
# Should contain: "API Request" with method, url, status, duration

# 4. Verify log rotation setting
docker compose -f docker-compose.dev.yml exec backend php artisan tinker --execute="\
  echo config('logging.channels.daily.days');"
# Should show: 14
```

## Commit

```
feat: add structured logging with auth and payment channels
```

# Step 03 — JWT Authentication & Core Middleware

## Goal
JWT auth works end-to-end: login via OTP → get token → access protected route → refresh → logout.
All core middleware is in place.

## Prerequisites
Steps 01–02 completed. Database has `users` table.

## Actions

### 1. Install packages

```bash
docker compose -f docker-compose.dev.yml exec backend composer require \
  tymon/jwt-auth:^2.3 \
  laravel/socialite:^5.26
```

### 2. Publish JWT config

```bash
docker compose -f docker-compose.dev.yml exec backend php artisan vendor:publish --provider="Tymon\JWTAuth\Providers\LaravelServiceProvider"
docker compose -f docker-compose.dev.yml exec backend php artisan jwt:secret
```

This creates `config/jwt.php` and adds `JWT_SECRET` to `.env`.

### 3. Configure JWT settings

Edit `config/jwt.php`:

```php
return [
    'secret' => env('JWT_SECRET'),
    'ttl' => 10080,              // 7 days in minutes
    'refresh_ttl' => 20160,      // 14 days
    'algo' => 'HS256',
    'required_claims' => ['iss', 'iat', 'exp', 'nbf', 'sub', 'jti'],
    'persistent_claims' => [],
    'lock_subject' => true,
    'leeway' => 0,
    'blacklist_enabled' => true,
    'blacklist_grace_period' => 0,
    // ... keep other defaults
];
```

### 4. Configure auth guard

Edit `config/auth.php`:

```php
'defaults' => [
    'guard' => 'api',
    'passwords' => 'users',
],

'guards' => [
    'web' => [
        'driver' => 'session',
        'provider' => 'users',
    ],
    'api' => [
        'driver' => 'jwt',
        'provider' => 'users',
    ],
],

'providers' => [
    'users' => [
        'driver' => 'eloquent',
        'model' => App\Models\User::class,
    ],
],
```

### 5. Update User model for JWT

Edit `app/Models/User.php`:

```php
<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'avatar_url',
        'telegram',
        'company',
        'locale',
        'timezone',
        'onboarding_completed_at',
        'email_verified_at',
        'phone_verified_at',
        'two_factor_enabled',
        'two_factor_method',
        'notification_enabled',
    ];

    protected $hidden = [
        'password',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'onboarding_completed_at' => 'datetime',
            'two_factor_enabled' => 'boolean',
            'notification_enabled' => 'boolean',
            'password' => 'hashed',
        ];
    }

    // --- JWTSubject ---

    public function getJWTIdentifier(): mixed
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return [];
    }
}
```

### 6. Create Enums

Create the following enum files:

**`app/Enums/Platform.php`**
```php
<?php

declare(strict_types=1);

namespace App\Enums;

enum Platform: string
{
    case Horoshop = 'horoshop';
    case Shopify = 'shopify';
    case WooCommerce = 'woocommerce';
    case OpenCart = 'opencart';
    case WordPress = 'wordpress';
    case Other = 'other';
}
```

**`app/Enums/UserRole.php`**
```php
<?php

declare(strict_types=1);

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Customer = 'customer';
}
```

### 7. Create OTP Service

OTP codes are stored in Redis with a TTL. Max 5 attempts, 30-second cooldown between resends.

**`app/Services/Auth/OtpService.php`**
```php
<?php

declare(strict_types=1);

namespace App\Services\Auth;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use App\Mail\Auth\OtpMail;

class OtpService
{
    private const TTL_SECONDS = 600;        // 10 minutes
    private const MAX_ATTEMPTS = 5;
    private const COOLDOWN_SECONDS = 30;
    private const CODE_LENGTH = 6;

    public function send(string $email): void
    {
        $this->enforceCooldown($email);

        $code = $this->generateCode();

        Cache::put(
            $this->codeKey($email),
            $code,
            self::TTL_SECONDS,
        );
        Cache::put(
            $this->attemptsKey($email),
            0,
            self::TTL_SECONDS,
        );
        Cache::put(
            $this->cooldownKey($email),
            true,
            self::COOLDOWN_SECONDS,
        );

        Mail::to($email)->queue(new OtpMail($code));
    }

    public function verify(string $email, string $code): bool
    {
        $attempts = (int) Cache::get($this->attemptsKey($email), 0);

        if ($attempts >= self::MAX_ATTEMPTS) {
            $this->invalidate($email);
            throw new \App\Exceptions\TooManyOtpAttemptsException();
        }

        Cache::increment($this->attemptsKey($email));

        $storedCode = Cache::get($this->codeKey($email));

        if ($storedCode === null || $storedCode !== $code) {
            return false;
        }

        $this->invalidate($email);

        return true;
    }

    public function invalidate(string $email): void
    {
        Cache::forget($this->codeKey($email));
        Cache::forget($this->attemptsKey($email));
    }

    private function generateCode(): string
    {
        return str_pad((string) random_int(0, 999999), self::CODE_LENGTH, '0', STR_PAD_LEFT);
    }

    private function enforceCooldown(string $email): void
    {
        if (Cache::has($this->cooldownKey($email))) {
            throw new \App\Exceptions\OtpCooldownException();
        }
    }

    private function codeKey(string $email): string
    {
        return "otp:code:{$email}";
    }

    private function attemptsKey(string $email): string
    {
        return "otp:attempts:{$email}";
    }

    private function cooldownKey(string $email): string
    {
        return "otp:cooldown:{$email}";
    }
}
```

### 8. Create OTP Mailable

**`app/Mail/Auth/OtpMail.php`**
```php
<?php

declare(strict_types=1);

namespace App\Mail\Auth;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OtpMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $code,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your verification code — Widgetis',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.auth.otp',
            with: ['code' => $this->code],
        );
    }
}
```

**`resources/views/mail/auth/otp.blade.php`**
```blade
<x-mail::message>
# Your verification code

Use this code to sign in to Widgetis:

<x-mail::panel>
**{{ $code }}**
</x-mail::panel>

This code expires in 10 minutes. If you didn't request it, ignore this email.

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
```

### 9. Create Exception classes

**`app/Exceptions/OtpCooldownException.php`**
```php
<?php

declare(strict_types=1);

namespace App\Exceptions;

use Symfony\Component\HttpKernel\Exception\HttpException;

class OtpCooldownException extends HttpException
{
    public function __construct()
    {
        parent::__construct(429, 'Please wait before requesting a new code.');
    }
}
```

**`app/Exceptions/TooManyOtpAttemptsException.php`**
```php
<?php

declare(strict_types=1);

namespace App\Exceptions;

use Symfony\Component\HttpKernel\Exception\HttpException;

class TooManyOtpAttemptsException extends HttpException
{
    public function __construct()
    {
        parent::__construct(429, 'Too many attempts. Please request a new code.');
    }
}
```

### 10. Create Core Middleware

**`app/Http/Middleware/ForceJsonResponse.php`**
```php
<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ForceJsonResponse
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->headers->set('Accept', 'application/json');

        return $next($request);
    }
}
```

**`app/Http/Middleware/SecurityHeaders.php`**
```php
<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

        return $response;
    }
}
```

**`app/Http/Middleware/SetLocale.php`**
```php
<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    private const SUPPORTED_LOCALES = ['uk', 'en'];
    private const DEFAULT_LOCALE = 'uk';

    public function handle(Request $request, Closure $next): Response
    {
        $locale = $request->header('Accept-Language', self::DEFAULT_LOCALE);

        // Extract primary language tag (e.g., "uk-UA" → "uk")
        $locale = strtolower(substr($locale, 0, 2));

        if (!in_array($locale, self::SUPPORTED_LOCALES, true)) {
            $locale = self::DEFAULT_LOCALE;
        }

        app()->setLocale($locale);

        return $next($request);
    }
}
```

### 11. Create Auth Controller

**`app/Http/Controllers/Api/V1/Auth/AuthController.php`**
```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Auth\OtpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function __construct(
        private readonly OtpService $otpService,
    ) {}

    /**
     * POST /api/v1/auth/otp
     * Send OTP code to email for login.
     */
    public function sendOtp(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email', 'max:255'],
        ]);

        $this->otpService->send($request->input('email'));

        return response()->json([
            'message' => 'OTP sent',
            'expires_in' => 600,
        ]);
    }

    /**
     * POST /api/v1/auth/otp/verify
     * Verify OTP code → return JWT. Creates user if not exists.
     */
    public function verifyOtp(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'code' => ['required', 'string', 'size:6'],
        ]);

        $email = $request->input('email');
        $code = $request->input('code');

        if (!$this->otpService->verify($email, $code)) {
            return response()->json([
                'error' => [
                    'code' => 'INVALID_OTP',
                    'message' => 'Invalid or expired code.',
                ],
            ], 401);
        }

        $user = User::firstOrCreate(
            ['email' => $email],
            ['email_verified_at' => now()],
        );

        if ($user->wasRecentlyCreated) {
            $user->email_verified_at = now();
            $user->save();
        }

        $token = Auth::guard('api')->login($user);

        return $this->respondWithToken($token, $user);
    }

    /**
     * POST /api/v1/auth/otp/resend
     * Resend OTP code (rate limited by OtpService).
     */
    public function resendOtp(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email', 'max:255'],
        ]);

        $this->otpService->send($request->input('email'));

        return response()->json([
            'message' => 'OTP resent',
            'expires_in' => 600,
        ]);
    }

    /**
     * POST /api/v1/auth/refresh
     * Refresh JWT token.
     */
    public function refresh(): JsonResponse
    {
        $token = Auth::guard('api')->refresh();
        $user = Auth::guard('api')->user();

        return $this->respondWithToken($token, $user);
    }

    /**
     * POST /api/v1/auth/logout
     * Invalidate JWT token.
     */
    public function logout(): JsonResponse
    {
        Auth::guard('api')->logout();

        return response()->json(status: 204);
    }

    /**
     * GET /api/v1/auth/user
     * Get current authenticated user.
     */
    public function user(): JsonResponse
    {
        $user = Auth::guard('api')->user();

        return response()->json(['data' => $user]);
    }

    private function respondWithToken(string $token, User $user): JsonResponse
    {
        return response()->json([
            'token' => $token,
            'token_type' => 'bearer',
            'expires_in' => config('jwt.ttl') * 60,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'locale' => $user->locale,
            ],
        ]);
    }
}
```

### 12. Register routes

**`routes/api.php`**
```php
<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API V1 Routes
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // --- Auth (public) ---
    Route::prefix('auth')->group(function () {
        Route::post('otp', [AuthController::class, 'sendOtp'])
            ->middleware('throttle:10,1');
        Route::post('otp/verify', [AuthController::class, 'verifyOtp'])
            ->middleware('throttle:10,1');
        Route::post('otp/resend', [AuthController::class, 'resendOtp'])
            ->middleware('throttle:3,1');
    });

    // --- Auth (protected) ---
    Route::prefix('auth')->middleware('auth:api')->group(function () {
        Route::post('refresh', [AuthController::class, 'refresh']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('user', [AuthController::class, 'user']);
    });
});
```

### 13. Register middleware in bootstrap

Edit `bootstrap/app.php` — add middleware to the API group:

```php
use App\Http\Middleware\ForceJsonResponse;
use App\Http\Middleware\SecurityHeaders;
use App\Http\Middleware\SetLocale;

->withMiddleware(function (Middleware $middleware) {
    $middleware->api(prepend: [
        ForceJsonResponse::class,
        SecurityHeaders::class,
        SetLocale::class,
    ]);
})
```

## How to Verify

```bash
# 1. Send OTP (check storage/logs/laravel.log for the code since MAIL_MAILER=log)
curl -X POST http://localhost:9002/api/v1/auth/otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
# Should return: {"message": "OTP sent", "expires_in": 600}

# 2. Read the OTP code from mail log
docker compose -f docker-compose.dev.yml exec backend grep -oP '"code":"(\d{6})"' storage/logs/laravel.log | tail -1
# Or check the log file manually for the 6-digit code

# 3. Verify OTP (replace CODE with the actual code)
curl -X POST http://localhost:9002/api/v1/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "code": "CODE"}'
# Should return: {"token": "eyJ...", "token_type": "bearer", ...}

# 4. Access protected route with token
curl http://localhost:9002/api/v1/auth/user \
  -H "Authorization: Bearer TOKEN_FROM_STEP_3"
# Should return user data

# 5. Refresh token
curl -X POST http://localhost:9002/api/v1/auth/refresh \
  -H "Authorization: Bearer TOKEN_FROM_STEP_3"
# Should return new token

# 6. Logout
curl -X POST http://localhost:9002/api/v1/auth/logout \
  -H "Authorization: Bearer NEW_TOKEN"
# Should return 204

# 7. Verify token is invalidated
curl http://localhost:9002/api/v1/auth/user \
  -H "Authorization: Bearer NEW_TOKEN"
# Should return 401
```

## Commit

```
feat: add JWT authentication with OTP login and core middleware
```

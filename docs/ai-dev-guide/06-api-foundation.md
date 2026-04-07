# Step 05 — API Foundation: Base Controller, Responses, Error Handling

## Goal
Consistent API response format across all endpoints. Centralized error handling.
Base controller with helper methods. Form Request pattern established.

## Prerequisites
Steps 01–04 completed.

## Actions

### 1. Create API response trait

All controllers will use this trait for consistent response formatting.

**`app/Http/Traits/ApiResponse.php`**
```php
<?php

declare(strict_types=1);

namespace App\Http\Traits;

use Illuminate\Http\JsonResponse;
use Illuminate\Pagination\LengthAwarePaginator;

trait ApiResponse
{
    protected function success(mixed $data = null, int $status = 200): JsonResponse
    {
        if ($data === null) {
            return response()->json(null, 204);
        }

        return response()->json($data, $status);
    }

    protected function created(mixed $data): JsonResponse
    {
        return response()->json($data, 201);
    }

    protected function noContent(): JsonResponse
    {
        return response()->json(null, 204);
    }

    protected function paginated(LengthAwarePaginator $paginator, array $extra = []): JsonResponse
    {
        $response = [
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ];

        if (!empty($extra)) {
            $response = array_merge($response, $extra);
        }

        return response()->json($response);
    }

    protected function error(string $code, string $message, int $status = 400, array $details = []): JsonResponse
    {
        $body = [
            'error' => [
                'code' => $code,
                'message' => $message,
            ],
        ];

        if (!empty($details)) {
            $body['error']['details'] = $details;
        }

        return response()->json($body, $status);
    }
}
```

### 2. Create base API controller

**`app/Http/Controllers/Api/V1/BaseController.php`**
```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\User;

abstract class BaseController extends Controller
{
    use ApiResponse;

    protected function currentUser(): User
    {
        return auth('api')->user();
    }

    protected function locale(): string
    {
        return app()->getLocale();
    }
}
```

### 3. Update AuthController to extend BaseController

Edit `app/Http/Controllers/Api/V1/Auth/AuthController.php`:
- Change `extends Controller` to `extends BaseController`
- Replace `response()->json(...)` calls with `$this->success(...)`, `$this->error(...)`, `$this->noContent()`
- Import: `use App\Http\Controllers\Api\V1\BaseController;`

Example changes:
```php
// Before:
return response()->json(['message' => 'OTP sent', 'expires_in' => 600]);

// After:
return $this->success(['message' => 'OTP sent', 'expires_in' => 600]);

// Before:
return response()->json([...], 401);

// After:
return $this->error('INVALID_OTP', 'Invalid or expired code.', 401);

// Before:
return response()->json(status: 204);

// After:
return $this->noContent();
```

### 4. Configure global exception handler

Edit `bootstrap/app.php` — add exception rendering:

```php
->withExceptions(function (Exceptions $exceptions) {
    $exceptions->render(function (\Illuminate\Validation\ValidationException $e) {
        return response()->json([
            'error' => [
                'code' => 'VALIDATION_ERROR',
                'message' => 'The given data was invalid.',
                'details' => $e->errors(),
            ],
        ], 422);
    });

    $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\NotFoundHttpException $e) {
        return response()->json([
            'error' => [
                'code' => 'NOT_FOUND',
                'message' => $e->getMessage() ?: 'Resource not found.',
            ],
        ], 404);
    });

    $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
        return response()->json([
            'error' => [
                'code' => 'HTTP_ERROR',
                'message' => $e->getMessage(),
            ],
        ], $e->getStatusCode());
    });

    $exceptions->render(function (\Tymon\JWTAuth\Exceptions\TokenExpiredException $e) {
        return response()->json([
            'error' => [
                'code' => 'TOKEN_EXPIRED',
                'message' => 'Token has expired.',
            ],
        ], 401);
    });

    $exceptions->render(function (\Tymon\JWTAuth\Exceptions\TokenInvalidException $e) {
        return response()->json([
            'error' => [
                'code' => 'TOKEN_INVALID',
                'message' => 'Token is invalid.',
            ],
        ], 401);
    });

    $exceptions->render(function (\Tymon\JWTAuth\Exceptions\JWTException $e) {
        return response()->json([
            'error' => [
                'code' => 'TOKEN_ABSENT',
                'message' => 'Token not provided.',
            ],
        ], 401);
    });
})
```

### 5. Create a sample Form Request

This establishes the pattern for all future form requests.

**`app/Http/Requests/Api/V1/Auth/SendOtpRequest.php`**
```php
<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Auth;

use Illuminate\Foundation\Http\FormRequest;

class SendOtpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email', 'max:255'],
        ];
    }
}
```

Update `AuthController::sendOtp` to use it:
```php
public function sendOtp(SendOtpRequest $request): JsonResponse
{
    $this->otpService->send($request->validated('email'));
    // ...
}
```

### 6. Create health check endpoint

**Add to `routes/api.php`** at the top of the v1 group:

```php
Route::prefix('v1')->group(function () {

    // --- Health check ---
    Route::get('health', function () {
        return response()->json([
            'status' => 'ok',
            'version' => app()->version(),
            'timestamp' => now()->toIso8601String(),
        ]);
    });

    // ... existing routes ...
});
```

## How to Verify

```bash
# 1. Health check
curl http://localhost:9002/api/v1/health
# {"status":"ok","version":"12.x.x","timestamp":"..."}

# 2. Validation error format
curl -X POST http://localhost:9002/api/v1/auth/otp \
  -H "Content-Type: application/json" \
  -d '{}'
# {"error":{"code":"VALIDATION_ERROR","message":"The given data was invalid.","details":{"email":["..."]}}}

# 3. 404 error format
curl http://localhost:9002/api/v1/nonexistent
# {"error":{"code":"NOT_FOUND","message":"..."}}

# 4. 401 error format (no token)
curl http://localhost:9002/api/v1/auth/user
# {"error":{"code":"TOKEN_ABSENT","message":"Token not provided."}}

# 5. 401 with bad token
curl http://localhost:9002/api/v1/auth/user \
  -H "Authorization: Bearer invalid.token.here"
# {"error":{"code":"TOKEN_INVALID","message":"Token is invalid."}}
```

## Commit

```
feat: add API response trait, base controller, and error handling
```

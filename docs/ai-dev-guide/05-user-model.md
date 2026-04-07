# Step 04 — User Model, Roles & Spatie Permission

## Goal
User model has roles (admin/customer) via Spatie Permission. Seeder creates a test admin.
Role-based middleware works: admin-only routes reject customers.

## Prerequisites
Steps 01–03 completed. JWT auth works. User model exists.

## Actions

### 1. Install Spatie Permission

```bash
docker compose -f docker-compose.dev.yml exec backend composer require spatie/laravel-permission:^7.0
docker compose -f docker-compose.dev.yml exec backend php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"
docker compose -f docker-compose.dev.yml exec backend php artisan migrate
```

This creates the `roles`, `permissions`, `model_has_roles`, `model_has_permissions` tables.

### 2. Update User model

Add the `HasRoles` trait to `app/Models/User.php`:

```php
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, HasRoles, Notifiable, SoftDeletes;

    // ... existing code ...

    // --- Helpers ---

    public function isAdmin(): bool
    {
        return $this->hasRole(UserRole::Admin->value);
    }

    public function isCustomer(): bool
    {
        return $this->hasRole(UserRole::Customer->value);
    }
}
```

Don't forget `use App\Enums\UserRole;` at the top.

### 3. Create RequireRole middleware

**`app/Http/Middleware/RequireRole.php`**
```php
<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user || !$user->hasAnyRole($roles)) {
            return response()->json([
                'error' => [
                    'code' => 'FORBIDDEN',
                    'message' => 'You do not have permission to access this resource.',
                ],
            ], 403);
        }

        return $next($request);
    }
}
```

### 4. Register middleware alias

Edit `bootstrap/app.php` — add alias:

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->api(prepend: [
        ForceJsonResponse::class,
        SecurityHeaders::class,
        SetLocale::class,
    ]);

    $middleware->alias([
        'role' => \App\Http\Middleware\RequireRole::class,
    ]);
})
```

### 5. Create Role Seeder

**`database/seeders/RoleSeeder.php`**
```php
<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\UserRole;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        foreach (UserRole::cases() as $role) {
            Role::findOrCreate($role->value, 'api');
        }
    }
}
```

### 6. Create Admin Seeder

**`database/seeders/AdminSeeder.php`**
```php
<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@widgetis.com'],
            [
                'name' => 'Admin',
                'email_verified_at' => now(),
                'locale' => 'uk',
            ],
        );

        $admin->assignRole(UserRole::Admin->value);
    }
}
```

### 7. Update DatabaseSeeder

**`database/seeders/DatabaseSeeder.php`**
```php
<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            AdminSeeder::class,
        ]);
    }
}
```

### 8. Run seeders

```bash
docker compose -f docker-compose.dev.yml exec backend php artisan db:seed
```

### 9. Auto-assign customer role on registration

Update `AuthController::verifyOtp` — after creating a new user, assign the customer role:

```php
if ($user->wasRecentlyCreated) {
    $user->email_verified_at = now();
    $user->save();
    $user->assignRole(\App\Enums\UserRole::Customer->value);
}
```

### 10. Add route groups for role-based access

Update `routes/api.php` — add placeholder groups for profile and admin:

```php
// --- Profile (customer) ---
Route::prefix('v1/profile')->middleware(['auth:api', 'role:customer,admin'])->group(function () {
    // Will be filled in Step 12
});

// --- Admin ---
Route::prefix('v1/admin')->middleware(['auth:api', 'role:admin'])->group(function () {
    // Will be filled in Step 13
});
```

## How to Verify

```bash
# 1. Fresh migrate + seed
docker compose -f docker-compose.dev.yml exec backend php artisan migrate:fresh --seed

# 2. Check roles exist
docker compose -f docker-compose.dev.yml exec backend php artisan tinker --execute="\
  echo 'Roles: ' . implode(', ', \Spatie\Permission\Models\Role::pluck('name')->toArray());"
# Should show: Roles: admin, customer

# 3. Check admin exists and has role
docker compose -f docker-compose.dev.yml exec backend php artisan tinker --execute="\
  \$u = \App\Models\User::where('email', 'admin@widgetis.com')->first(); \
  echo \$u->name . ' — roles: ' . implode(', ', \$u->getRoleNames()->toArray());"
# Should show: Admin — roles: admin

# 4. Login as admin via OTP, then try accessing an admin-only route
# (route doesn't exist yet, but the middleware stack should accept admin tokens)

# 5. Register a new user via OTP, verify they get 'customer' role
curl -X POST http://localhost:9002/api/v1/auth/otp \
  -H "Content-Type: application/json" \
  -d '{"email": "customer@test.com"}'
# Get code from log, verify, then check role in tinker
```

## Commit

```
feat: add User roles (admin/customer) with Spatie Permission
```

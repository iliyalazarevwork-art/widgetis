<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Core\Models\User;
use App\Enums\UserRole;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $configuredEmail = config('app.admin_email');
        $email = is_string($configuredEmail) && trim($configuredEmail) !== ''
            ? trim($configuredEmail)
            : 'admin@widgetis.com';

        $configuredPassword = config('app.admin_password');
        $password = is_string($configuredPassword) && trim($configuredPassword) !== ''
            ? $configuredPassword
            : Str::random(32);

        $admin = User::updateOrCreate(
            ['email' => $email],
            [
                'name' => 'Admin',
                'password' => Hash::make($password),
                'email_verified_at' => now(),
                'locale' => 'uk',
            ],
        );

        $admin->syncRoles([UserRole::Admin->value]);

        if (!is_string($configuredPassword) || trim($configuredPassword) === '') {
            $this->command?->warn(
                'FILAMENT_ADMIN_PASSWORD is not set. Admin user was created with a random password; OTP login still works for admin role.',
            );
        }
    }
}

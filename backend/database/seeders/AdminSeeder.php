<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $email = config('app.admin_email', 'admin@widgetis.com');
        $password = config('app.admin_password', 'admin123');

        $admin = User::updateOrCreate(
            ['email' => $email],
            [
                'name' => 'Admin',
                'password' => Hash::make($password),
                'email_verified_at' => now(),
                'locale' => 'uk',
            ],
        );

        $admin->assignRole(UserRole::Admin->value);
    }
}

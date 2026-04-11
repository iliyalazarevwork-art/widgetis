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
        $email = config('app.admin_email');
        $password = config('app.admin_password');

        if (!is_string($email) || trim($email) === '' || !is_string($password) || trim($password) === '') {
            $this->command?->warn('AdminSeeder skipped: set FILAMENT_ADMIN_EMAIL and FILAMENT_ADMIN_PASSWORD first.');

            return;
        }

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

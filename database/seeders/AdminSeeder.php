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

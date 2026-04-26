<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Core\Models\User;
use App\Enums\Platform;
use App\Enums\SiteStatus;
use App\WidgetRuntime\Models\Site;
use Illuminate\Database\Seeder;

/**
 * Seeds reference Horoshop sites bound to the admin user so that the
 * widget runtime (Origin-checked endpoints, demo previews) can be
 * exercised against real merchant storefronts without a customer signup.
 *
 * Idempotent — re-running keeps existing sites untouched.
 */
class AdminTestSitesSeeder extends Seeder
{
    /** @var list<array{domain: string, name: string, url: string}> */
    private const TEST_SITES = [
        [
            'domain' => 'pozolotka.ua',
            'name'   => 'Pozolotka (admin test)',
            'url'    => 'https://pozolotka.ua',
        ],
    ];

    public function run(): void
    {
        $configuredEmail = config('app.admin_email');
        $email = is_string($configuredEmail) && trim($configuredEmail) !== ''
            ? trim($configuredEmail)
            : 'admin@widgetis.com';

        $admin = User::where('email', $email)->first();

        if ($admin === null) {
            $this->command->warn(
                "AdminTestSitesSeeder skipped: admin user '{$email}' not found. Run AdminSeeder first.",
            );

            return;
        }

        foreach (self::TEST_SITES as $site) {
            Site::firstOrCreate(
                ['domain' => $site['domain'], 'user_id' => $admin->id],
                [
                    'name'     => $site['name'],
                    'url'      => $site['url'],
                    'platform' => Platform::Horoshop,
                    'status'   => SiteStatus::Active,
                ],
            );
        }
    }
}

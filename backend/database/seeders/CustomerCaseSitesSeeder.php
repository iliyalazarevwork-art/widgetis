<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Core\Models\User;
use App\Enums\Platform;
use App\Enums\SiteStatus;
use App\WidgetRuntime\Models\Site;
use Illuminate\Database\Seeder;

final class CustomerCaseSitesSeeder extends Seeder
{
    public function run(): void
    {
        $configuredEmail = config('app.admin_email');
        $email = is_string($configuredEmail) && trim($configuredEmail) !== ''
            ? trim($configuredEmail)
            : 'admin@widgetis.com';

        $admin = User::where('email', $email)->first();

        if ($admin === null) {
            $this->command?->warn(
                "CustomerCaseSitesSeeder skipped: admin user '{$email}' not found. Run AdminSeeder first.",
            );

            return;
        }

        foreach (CustomerCasesSeeder::sites() as $caseSite) {
            $domain = Site::domainFromUrl($caseSite['store_url']);

            if ($domain === '') {
                continue;
            }

            Site::updateOrCreate(
                ['domain' => $domain, 'user_id' => $admin->id],
                [
                    'name'     => $caseSite['owner'],
                    'url'      => $caseSite['store_url'],
                    'platform' => Platform::Other,
                    'status'   => SiteStatus::Active,
                ],
            );
        }
    }
}

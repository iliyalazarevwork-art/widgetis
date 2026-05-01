<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Listeners;

use App\Enums\SiteStatus;
use App\Shared\Events\Subscription\GuestSiteRequested;
use App\WidgetRuntime\Exceptions\InvalidSiteDomainException;
use App\WidgetRuntime\Models\Site;
use App\WidgetRuntime\Models\SiteScript;
use Illuminate\Support\Facades\Log;

final class CreateSiteOnGuestSiteRequested
{
    public function handle(GuestSiteRequested $event): void
    {
        $domain = Site::domainFromUrl($event->domain);

        if ($domain === '') {
            throw new InvalidSiteDomainException(
                "Cannot create site: empty domain after normalization (input: {$event->domain}).",
            );
        }

        $site = Site::firstOrCreate(
            ['user_id' => $event->userId->value, 'domain' => $domain],
            [
                'name'     => $domain,
                'url'      => 'https://' . $domain,
                'platform' => $event->platform,
                'status'   => SiteStatus::Pending,
            ],
        );

        // Ensure a script record exists for the site
        if ($site->wasRecentlyCreated) {
            SiteScript::firstOrCreate(
                ['site_id' => $site->id],
                [
                    'token'     => SiteScript::generateToken(),
                    'is_active' => false,
                ],
            );
        }

        Log::info('CreateSiteOnGuestSiteRequested: site ensured.', [
            'user_id' => $event->userId->value,
            'domain' => $event->domain,
            'site_id' => $site->id,
            'was_created' => $site->wasRecentlyCreated,
        ]);
    }
}

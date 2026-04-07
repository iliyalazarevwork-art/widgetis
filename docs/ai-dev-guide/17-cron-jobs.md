# Step 16 — Scheduled Tasks (Cron Jobs)

## Goal
Automated background tasks: expire trials, process grace periods, clean up demo sessions,
send trial ending reminders, clean old notifications.

## Prerequisites
Steps 01–15 completed.

## Actions

### 1. Create Artisan commands

**`app/Console/Commands/ExpireTrials.php`**
```php
<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\SubscriptionStatus;
use App\Models\Subscription;
use App\Services\Billing\SubscriptionService;
use Illuminate\Console\Command;

class ExpireTrials extends Command
{
    protected $signature = 'subscriptions:expire-trials';
    protected $description = 'Expire trial subscriptions that have passed their trial end date';

    public function handle(SubscriptionService $subscriptionService): int
    {
        $expired = Subscription::where('status', SubscriptionStatus::Trial)
            ->where('trial_ends_at', '<', now())
            ->get();

        $count = 0;
        foreach ($expired as $subscription) {
            $subscriptionService->expire($subscription);
            $count++;
        }

        $this->info("Expired {$count} trial subscriptions.");

        return self::SUCCESS;
    }
}
```

**`app/Console/Commands/ProcessGracePeriod.php`**
```php
<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\SubscriptionStatus;
use App\Models\Subscription;
use App\Services\Billing\SubscriptionService;
use Illuminate\Console\Command;

class ProcessGracePeriod extends Command
{
    protected $signature = 'subscriptions:process-grace-period';
    protected $description = 'Expire subscriptions that have exceeded their grace period';

    public function handle(SubscriptionService $subscriptionService): int
    {
        $expired = Subscription::where('status', SubscriptionStatus::PastDue)
            ->where('grace_period_ends_at', '<', now())
            ->get();

        $count = 0;
        foreach ($expired as $subscription) {
            $subscriptionService->expire($subscription);
            $count++;
        }

        $this->info("Expired {$count} grace period subscriptions.");

        return self::SUCCESS;
    }
}
```

**`app/Console/Commands/CleanupDemoSessions.php`**
```php
<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\DemoSession;
use Illuminate\Console\Command;

class CleanupDemoSessions extends Command
{
    protected $signature = 'demo:cleanup';
    protected $description = 'Delete expired demo sessions';

    public function handle(): int
    {
        $count = DemoSession::where('expires_at', '<', now())->delete();

        $this->info("Deleted {$count} expired demo sessions.");

        return self::SUCCESS;
    }
}
```

**`app/Console/Commands/SendTrialEndingReminders.php`**
```php
<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\NotificationType;
use App\Enums\SubscriptionStatus;
use App\Models\Subscription;
use App\Services\Notification\NotificationService;
use Illuminate\Console\Command;

class SendTrialEndingReminders extends Command
{
    protected $signature = 'notifications:trial-ending';
    protected $description = 'Send notifications to users whose trial ends in 3 or 1 days';

    public function handle(NotificationService $notificationService): int
    {
        $count = 0;

        foreach ([3, 1] as $daysLeft) {
            $subscriptions = Subscription::with('user', 'plan')
                ->where('status', SubscriptionStatus::Trial)
                ->whereDate('trial_ends_at', now()->addDays($daysLeft)->toDateString())
                ->get();

            foreach ($subscriptions as $sub) {
                $price = $sub->plan->price_monthly;
                $planName = $sub->plan->slug;

                $notificationService->create(
                    $sub->user,
                    NotificationType::TrialWarning,
                    [
                        'en' => "Trial ending in {$daysLeft} day(s)",
                        'uk' => "Trial закінчується через {$daysLeft} " . ($daysLeft === 1 ? 'день' : 'дні'),
                    ],
                    [
                        'en' => "After trial, {$price} UAH will be charged for {$planName}.",
                        'uk' => "Після trial буде списано {$price} грн за {$planName}.",
                    ],
                    ['subscription_id' => $sub->id, 'days_left' => $daysLeft],
                );

                $count++;
            }
        }

        $this->info("Sent {$count} trial ending reminders.");

        return self::SUCCESS;
    }
}
```

**`app/Console/Commands/CleanupNotifications.php`**
```php
<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\AppNotification;
use Illuminate\Console\Command;

class CleanupNotifications extends Command
{
    protected $signature = 'notifications:cleanup {--days=90}';
    protected $description = 'Delete read notifications older than N days';

    public function handle(): int
    {
        $days = (int) $this->option('days');

        $count = AppNotification::where('is_read', true)
            ->where('created_at', '<', now()->subDays($days))
            ->delete();

        $this->info("Deleted {$count} old notifications (>{$days} days).");

        return self::SUCCESS;
    }
}
```

### 2. Register scheduled tasks

Edit `routes/console.php`:

```php
<?php

use Illuminate\Support\Facades\Schedule;

// Every 5 minutes: check pending payments (placeholder for payment integration)
// Schedule::command('orders:check-pending')->everyFiveMinutes();

// Daily at 04:00: expire trial subscriptions
Schedule::command('subscriptions:expire-trials')->dailyAt('04:00');

// Daily at 04:30: expire grace period subscriptions
Schedule::command('subscriptions:process-grace-period')->dailyAt('04:30');

// Daily at 03:00: clean up expired demo sessions
Schedule::command('demo:cleanup')->dailyAt('03:00');

// Daily at 05:00: send trial ending reminders (3 days and 1 day before)
Schedule::command('notifications:trial-ending')->dailyAt('05:00');

// Daily at 06:00: clean up old read notifications (>90 days)
Schedule::command('notifications:cleanup --days=90')->dailyAt('06:00');
```

### 3. Add scheduler to Docker

For the scheduler to run, add a cron entry or a separate container.
The simplest approach for dev: run the scheduler manually.

For production, add to `docker-compose.yml` a scheduler service:

```yaml
scheduler:
  build:
    context: .
    dockerfile: Dockerfile
  command: ["sh", "-c", "while true; do php artisan schedule:run --verbose --no-interaction; sleep 60; done"]
  volumes:
    - .:/var/www/html
  depends_on:
    - postgres
    - redis
  networks:
    - widgetis-v2
```

## How to Verify

```bash
# 1. Run each command manually
docker compose -f docker-compose.dev.yml exec backend php artisan subscriptions:expire-trials
docker compose -f docker-compose.dev.yml exec backend php artisan subscriptions:process-grace-period
docker compose -f docker-compose.dev.yml exec backend php artisan demo:cleanup
docker compose -f docker-compose.dev.yml exec backend php artisan notifications:trial-ending
docker compose -f docker-compose.dev.yml exec backend php artisan notifications:cleanup

# Each should print a count and succeed

# 2. Verify schedule is registered
docker compose -f docker-compose.dev.yml exec backend php artisan schedule:list
# Should show all 5 scheduled commands with their frequencies

# 3. Test with a trial that should expire
docker compose -f docker-compose.dev.yml exec backend php artisan tinker --execute="\
  \$user = \App\Models\User::first(); \
  \$plan = \App\Models\Plan::where('slug', 'pro')->first(); \
  \$sub = app(\App\Services\Billing\SubscriptionService::class)->createTrial(\$user, \$plan); \
  \$sub->update(['trial_ends_at' => now()->subDay()]); \
  echo 'Created expired trial';"

docker compose -f docker-compose.dev.yml exec backend php artisan subscriptions:expire-trials
# Should say "Expired 1 trial subscriptions."
```

## Commit

```
feat: add scheduled tasks for trial expiry, grace period, and cleanup
```

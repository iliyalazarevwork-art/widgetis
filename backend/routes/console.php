<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Schedule;

// Daily at 03:30: move subscriptions past period end to PastDue (3-day grace period starts)
Schedule::command('subscriptions:expire')->dailyAt('03:30');

// Daily at 04:00: expire trial subscriptions
Schedule::command('subscriptions:expire-trials')->dailyAt('04:00');

// Daily at 04:30: expire grace period subscriptions and disable their widgets
Schedule::command('subscriptions:process-grace-period')->dailyAt('04:30');

// Daily at 03:00: clean up expired demo sessions
Schedule::command('demo:cleanup')->dailyAt('03:00');

// Daily at 05:00: send trial ending reminders (3 days and 1 day before)
Schedule::command('notifications:trial-ending')->dailyAt('05:00');

// Daily at 06:00: clean up old read notifications (>90 days)
Schedule::command('notifications:cleanup --days=90')->dailyAt('06:00');

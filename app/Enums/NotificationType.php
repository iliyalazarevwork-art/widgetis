<?php

declare(strict_types=1);

namespace App\Enums;

enum NotificationType: string
{
    case TrialWarning = 'trial_warning';
    case WidgetActivated = 'widget_activated';
    case UpdateAvailable = 'update_available';
    case PaymentSuccess = 'payment_success';
    case PaymentFailed = 'payment_failed';
    case PlanChanged = 'plan_changed';
    case SubscriptionCancelled = 'subscription_cancelled';

    public function label(): string
    {
        return match ($this) {
            self::TrialWarning => 'Trial Warning',
            self::WidgetActivated => 'Widget Activated',
            self::UpdateAvailable => 'Update Available',
            self::PaymentSuccess => 'Payment Success',
            self::PaymentFailed => 'Payment Failed',
            self::PlanChanged => 'Plan Changed',
            self::SubscriptionCancelled => 'Subscription Cancelled',
        };
    }
}

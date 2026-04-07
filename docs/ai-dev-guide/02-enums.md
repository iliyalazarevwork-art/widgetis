# Step 02 — PHP Enums

## Goal
All PHP enums are created before migrations and models. Every status, type, and role
in the project has a dedicated enum. These enums are the single source of truth —
migrations use their `->value` for defaults, models cast columns to them,
and business logic compares against enum cases (never raw strings).

## Prerequisites
Step 01 completed. Laravel project exists.

## Actions

### 1. Create the `app/Enums/` directory

All enums go into `app/Enums/`. Create every file listed below.

---

### 2. UserRole

Used for Spatie Permission role names. Two roles in the system.

**`app/Enums/UserRole.php`**
```php
<?php

declare(strict_types=1);

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Customer = 'customer';

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Administrator',
            self::Customer => 'Customer',
        };
    }
}
```

---

### 3. Platform

Which e-commerce platform a site or product belongs to.
MVP = Horoshop only, but the enum is ready for expansion.

**`app/Enums/Platform.php`**
```php
<?php

declare(strict_types=1);

namespace App\Enums;

enum Platform: string
{
    case Horoshop = 'horoshop';
    case Shopify = 'shopify';
    case WooCommerce = 'woocommerce';
    case OpenCart = 'opencart';
    case WordPress = 'wordpress';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::Horoshop => 'Horoshop',
            self::Shopify => 'Shopify',
            self::WooCommerce => 'WooCommerce',
            self::OpenCart => 'OpenCart',
            self::WordPress => 'WordPress',
            self::Other => 'Other',
        };
    }
}
```

---

### 4. SubscriptionStatus

Lifecycle of a subscription: trial → active → (past_due → expired) or cancelled.

**`app/Enums/SubscriptionStatus.php`**
```php
<?php

declare(strict_types=1);

namespace App\Enums;

enum SubscriptionStatus: string
{
    case Active = 'active';
    case Trial = 'trial';
    case PastDue = 'past_due';
    case Cancelled = 'cancelled';
    case Expired = 'expired';

    public function label(): string
    {
        return match ($this) {
            self::Active => 'Active',
            self::Trial => 'Trial',
            self::PastDue => 'Past Due',
            self::Cancelled => 'Cancelled',
            self::Expired => 'Expired',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Active => 'success',
            self::Trial => 'info',
            self::PastDue => 'warning',
            self::Cancelled => 'gray',
            self::Expired => 'danger',
        };
    }

    /**
     * Statuses that grant the user access to their plan features.
     */
    public static function accessGranting(): array
    {
        return [self::Active, self::Trial];
    }
}
```

---

### 5. BillingPeriod

How often the user is billed.

**`app/Enums/BillingPeriod.php`**
```php
<?php

declare(strict_types=1);

namespace App\Enums;

enum BillingPeriod: string
{
    case Monthly = 'monthly';
    case Yearly = 'yearly';

    public function label(): string
    {
        return match ($this) {
            self::Monthly => 'Monthly',
            self::Yearly => 'Yearly',
        };
    }

    public function months(): int
    {
        return match ($this) {
            self::Monthly => 1,
            self::Yearly => 12,
        };
    }
}
```

---

### 6. OrderStatus

Lifecycle of an order (subscription purchase/renewal).

**`app/Enums/OrderStatus.php`**
```php
<?php

declare(strict_types=1);

namespace App\Enums;

enum OrderStatus: string
{
    case Pending = 'pending';
    case Paid = 'paid';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
    case Refunded = 'refunded';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Paid => 'Paid',
            self::Completed => 'Completed',
            self::Cancelled => 'Cancelled',
            self::Refunded => 'Refunded',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Pending => 'warning',
            self::Paid => 'success',
            self::Completed => 'success',
            self::Cancelled => 'gray',
            self::Refunded => 'danger',
        };
    }
}
```

---

### 7. PaymentType

What kind of payment transaction it is.

**`app/Enums/PaymentType.php`**
```php
<?php

declare(strict_types=1);

namespace App\Enums;

enum PaymentType: string
{
    case Charge = 'charge';
    case Refund = 'refund';
    case TrialActivation = 'trial_activation';

    public function label(): string
    {
        return match ($this) {
            self::Charge => 'Charge',
            self::Refund => 'Refund',
            self::TrialActivation => 'Trial Activation',
        };
    }
}
```

---

### 8. PaymentStatus

**`app/Enums/PaymentStatus.php`**
```php
<?php

declare(strict_types=1);

namespace App\Enums;

enum PaymentStatus: string
{
    case Pending = 'pending';
    case Success = 'success';
    case Failed = 'failed';
    case Refunded = 'refunded';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Success => 'Success',
            self::Failed => 'Failed',
            self::Refunded => 'Refunded',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Pending => 'warning',
            self::Success => 'success',
            self::Failed => 'danger',
            self::Refunded => 'info',
        };
    }
}
```

---

### 9. SiteStatus

Lifecycle of a connected site.

**`app/Enums/SiteStatus.php`**
```php
<?php

declare(strict_types=1);

namespace App\Enums;

enum SiteStatus: string
{
    case Pending = 'pending';
    case Active = 'active';
    case Deactivated = 'deactivated';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Active => 'Active',
            self::Deactivated => 'Deactivated',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Pending => 'warning',
            self::Active => 'success',
            self::Deactivated => 'gray',
        };
    }
}
```

---

### 10. LeadStatus

Used for consultations and manager requests.

**`app/Enums/LeadStatus.php`**
```php
<?php

declare(strict_types=1);

namespace App\Enums;

enum LeadStatus: string
{
    case New = 'new';
    case InProgress = 'in_progress';
    case Completed = 'completed';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::New => 'New',
            self::InProgress => 'In Progress',
            self::Completed => 'Completed',
            self::Cancelled => 'Cancelled',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::New => 'info',
            self::InProgress => 'warning',
            self::Completed => 'success',
            self::Cancelled => 'gray',
        };
    }
}
```

---

### 11. ReviewStatus

**`app/Enums/ReviewStatus.php`**
```php
<?php

declare(strict_types=1);

namespace App\Enums;

enum ReviewStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Rejected = 'rejected';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Approved => 'Approved',
            self::Rejected => 'Rejected',
        };
    }
}
```

---

### 12. ProductStatus

**`app/Enums/ProductStatus.php`**
```php
<?php

declare(strict_types=1);

namespace App\Enums;

enum ProductStatus: string
{
    case Active = 'active';
    case Inactive = 'inactive';
    case Draft = 'draft';

    public function label(): string
    {
        return match ($this) {
            self::Active => 'Active',
            self::Inactive => 'Inactive',
            self::Draft => 'Draft',
        };
    }
}
```

---

### 13. NotificationType

Types of in-app notifications sent to users.

**`app/Enums/NotificationType.php`**
```php
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
```

---

### 14. ManagerRequestType

**`app/Enums/ManagerRequestType.php`**
```php
<?php

declare(strict_types=1);

namespace App\Enums;

enum ManagerRequestType: string
{
    case InstallHelp = 'install_help';
    case General = 'general';
    case DemoRequest = 'demo_request';

    public function label(): string
    {
        return match ($this) {
            self::InstallHelp => 'Installation Help',
            self::General => 'General',
            self::DemoRequest => 'Demo Request',
        };
    }
}
```

---

### 15. Messenger

**`app/Enums/Messenger.php`**
```php
<?php

declare(strict_types=1);

namespace App\Enums;

enum Messenger: string
{
    case Telegram = 'telegram';
    case Viber = 'viber';
    case WhatsApp = 'whatsapp';

    public function label(): string
    {
        return match ($this) {
            self::Telegram => 'Telegram',
            self::Viber => 'Viber',
            self::WhatsApp => 'WhatsApp',
        };
    }
}
```

---

### 16. ScriptBuildStatus

**`app/Enums/ScriptBuildStatus.php`**
```php
<?php

declare(strict_types=1);

namespace App\Enums;

enum ScriptBuildStatus: string
{
    case Active = 'active';
    case Inactive = 'inactive';

    public function label(): string
    {
        return match ($this) {
            self::Active => 'Active',
            self::Inactive => 'Inactive',
        };
    }
}
```

---

## Summary

After this step, you have **15 enum files** in `app/Enums/`:

| Enum | Values | Used in |
|------|--------|---------|
| `UserRole` | admin, customer | Spatie roles |
| `Platform` | horoshop, shopify, woocommerce, opencart, wordpress, other | products, sites |
| `SubscriptionStatus` | active, trial, past_due, cancelled, expired | subscriptions |
| `BillingPeriod` | monthly, yearly | subscriptions, orders |
| `OrderStatus` | pending, paid, completed, cancelled, refunded | orders |
| `PaymentType` | charge, refund, trial_activation | payments |
| `PaymentStatus` | pending, success, failed, refunded | payments |
| `SiteStatus` | pending, active, deactivated | sites |
| `LeadStatus` | new, in_progress, completed, cancelled | consultations, manager_requests |
| `ReviewStatus` | pending, approved, rejected | reviews |
| `ProductStatus` | active, inactive, draft | products |
| `NotificationType` | trial_warning, widget_activated, ... (7 total) | notifications |
| `ManagerRequestType` | install_help, general, demo_request | manager_requests |
| `Messenger` | telegram, viber, whatsapp | manager_requests |
| `ScriptBuildStatus` | active, inactive | site_script_builds |

## How to Verify

```bash
# All enum files exist
docker compose -f docker-compose.dev.yml exec backend \
  find app/Enums -name "*.php" | sort | wc -l
# Expected: 15

# Each enum is valid PHP
docker compose -f docker-compose.dev.yml exec backend \
  php -r "foreach(glob('app/Enums/*.php') as \$f) { require_once \$f; echo basename(\$f) . ' OK\n'; }"

# Spot-check: SubscriptionStatus has the right cases
docker compose -f docker-compose.dev.yml exec backend \
  php artisan tinker --execute="foreach(\App\Enums\SubscriptionStatus::cases() as \$c) echo \$c->value . ' → ' . \$c->label() . PHP_EOL;"
# Expected:
# active → Active
# trial → Trial
# past_due → Past Due
# cancelled → Cancelled
# expired → Expired
```

## Commit

```bash
git add -A
git commit -m "feat: add all PHP enums for statuses, types, and roles"
git push origin main
```

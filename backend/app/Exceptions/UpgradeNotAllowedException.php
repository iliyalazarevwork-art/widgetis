<?php

declare(strict_types=1);

namespace App\Exceptions;

use RuntimeException;

/**
 * Raised when an upgrade quote cannot be produced because the transition is
 * disallowed (downgrade, same plan + same period, or trial subscription).
 *
 * The $code property carries a machine-readable reason so the HTTP layer can
 * translate it into a stable API error code without string-sniffing.
 */
final class UpgradeNotAllowedException extends RuntimeException
{
    public const REASON_DOWNGRADE = 'DOWNGRADE_NOT_ALLOWED';
    public const REASON_SAME_PLAN = 'SAME_PLAN';
    public const REASON_TRIAL = 'USE_CHECKOUT';
    public const REASON_NO_SUBSCRIPTION = 'NO_SUBSCRIPTION';

    public function __construct(public readonly string $reason, string $message)
    {
        parent::__construct($message);
    }

    public static function downgrade(): self
    {
        return new self(
            self::REASON_DOWNGRADE,
            'Downgrade is not allowed. Wait until the current period ends, then buy the lower plan.',
        );
    }

    public static function samePlan(): self
    {
        return new self(
            self::REASON_SAME_PLAN,
            'Target plan and billing period match the current subscription.',
        );
    }

    public static function trial(): self
    {
        return new self(
            self::REASON_TRIAL,
            'Trial users must go through the regular checkout flow.',
        );
    }

    public static function noSubscription(): self
    {
        return new self(
            self::REASON_NO_SUBSCRIPTION,
            'No active subscription to upgrade.',
        );
    }
}

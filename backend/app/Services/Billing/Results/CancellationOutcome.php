<?php

declare(strict_types=1);

namespace App\Services\Billing\Results;

enum CancellationOutcome: string
{
    case Cancelled = 'cancelled';
    case AlreadyInactive = 'already_inactive';
    case Failed = 'failed';
}

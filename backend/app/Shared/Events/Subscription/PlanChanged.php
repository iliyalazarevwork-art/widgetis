<?php

declare(strict_types=1);

namespace App\Shared\Events\Subscription;

use App\Shared\ValueObjects\UserId;

final readonly class PlanChanged
{
    public function __construct(
        public UserId $userId,
        public ?string $oldPlanSlug,
        public ?string $newPlanSlug,
    ) {
    }
}

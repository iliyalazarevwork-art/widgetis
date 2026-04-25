<?php

declare(strict_types=1);

namespace App\Shared\Events\User;

use App\Shared\ValueObjects\UserId;

final readonly class Deleted
{
    public function __construct(public UserId $userId)
    {
    }
}

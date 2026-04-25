<?php

declare(strict_types=1);

namespace App\Shared\Contracts;

use App\Shared\DTO\UserSnapshot;
use App\Shared\ValueObjects\UserId;

interface UserResolverInterface
{
    public function findById(UserId $id): ?UserSnapshot;

    public function existsById(UserId $id): bool;
}

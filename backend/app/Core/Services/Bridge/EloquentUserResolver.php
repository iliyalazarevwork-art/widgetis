<?php

declare(strict_types=1);

namespace App\Core\Services\Bridge;

use App\Core\Models\User;
use App\Shared\Contracts\UserResolverInterface;
use App\Shared\DTO\UserSnapshot;
use App\Shared\ValueObjects\UserId;

final class EloquentUserResolver implements UserResolverInterface
{
    public function findById(UserId $id): ?UserSnapshot
    {
        $user = User::find($id->value);

        if ($user === null) {
            return null;
        }

        return new UserSnapshot(
            id: UserId::fromString((string) $user->id),
            email: $user->email,
            name: $user->name,
            locale: $user->locale,
        );
    }

    public function existsById(UserId $id): bool
    {
        return User::where('id', $id->value)->exists();
    }
}

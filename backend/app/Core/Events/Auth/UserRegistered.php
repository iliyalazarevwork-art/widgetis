<?php

declare(strict_types=1);

namespace App\Core\Events\Auth;

use App\Core\Models\User;
use Illuminate\Foundation\Events\Dispatchable;

class UserRegistered
{
    use Dispatchable;

    public function __construct(public readonly User $user)
    {
    }
}

<?php

declare(strict_types=1);

namespace App\Core\Http\Controllers\Api\V1;

use App\Core\Models\User;
use App\Http\Controllers\Api\V1\BaseController;

/**
 * Base controller for Core bounded context.
 * Provides a typed currentUser() returning the Core User model.
 */
abstract class CoreBaseController extends BaseController
{
    protected function currentUser(): User
    {
        /** @var User $user */
        $user = auth('core')->user();

        return $user;
    }
}

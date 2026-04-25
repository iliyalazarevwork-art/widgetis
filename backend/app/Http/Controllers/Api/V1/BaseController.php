<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Core\Models\User;
use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;

abstract class BaseController extends Controller
{
    use ApiResponse;

    protected function currentUser(): User
    {
        /** @var User $user */
        $user = auth('api')->user();

        return $user;
    }

    protected function locale(): string
    {
        return app()->getLocale();
    }
}

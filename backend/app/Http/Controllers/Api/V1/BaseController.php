<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use Illuminate\Contracts\Auth\Authenticatable;

abstract class BaseController extends Controller
{
    use ApiResponse;

    protected function currentUser(): Authenticatable
    {
        /** @var Authenticatable $user */
        $user = auth('api')->user();

        return $user;
    }

    protected function authedUserId(): string
    {
        return (string) auth('api')->id();
    }

    protected function locale(): string
    {
        return app()->getLocale();
    }
}

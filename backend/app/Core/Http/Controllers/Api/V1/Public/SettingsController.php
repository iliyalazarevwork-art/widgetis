<?php

declare(strict_types=1);

namespace App\Core\Http\Controllers\Api\V1\Public;

use App\Core\Settings\GeneralSettings;
use App\Http\Controllers\Api\V1\BaseController;
use Illuminate\Http\JsonResponse;

class SettingsController extends BaseController
{
    public function index(GeneralSettings $settings): JsonResponse
    {
        return $this->success([
            'data' => [
                'phone' => $settings->phone,
                'email' => $settings->email,
                'business_hours' => $settings->business_hours,
                'socials' => $settings->socials,
                'messengers' => $settings->messengers,
                'stats' => $settings->stats,
            ],
        ]);
    }
}

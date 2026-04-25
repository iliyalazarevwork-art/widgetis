<?php

declare(strict_types=1);

namespace App\Core\Http\Controllers\Api\V1\Public;

use App\Core\Http\Controllers\Api\V1\CoreBaseController;
use App\Shared\Settings\GeneralSettings;
use Illuminate\Http\JsonResponse;

class SettingsController extends CoreBaseController
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

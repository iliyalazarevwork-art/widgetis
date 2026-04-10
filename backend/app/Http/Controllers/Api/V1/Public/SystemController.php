<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Enums\Platform;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

final class SystemController extends Controller
{
    public function health(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'version' => app()->version(),
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    public function platforms(): JsonResponse
    {
        return response()->json([
            'data' => Platform::toArray(),
        ]);
    }
}

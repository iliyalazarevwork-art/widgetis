<?php

declare(strict_types=1);

namespace App\Core\Http\Controllers\Api\V1\Public;

use App\Core\Services\Plan\FoundingService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

final class FoundingController extends Controller
{
    public function __construct(
        private readonly FoundingService $foundingService,
    ) {
    }

    /**
     * Return the number of founding slots remaining.
     *
     * This is a public endpoint — no auth required.
     * Drives the founding-member countdown on the pricing page.
     */
    public function remaining(): JsonResponse
    {
        return response()->json([
            'data' => [
                'remaining' => $this->foundingService->remainingSlots(),
                'total' => $this->foundingService->totalSlots(),
                'price_monthly' => $this->foundingService->lockedPriceMonthly(),
                'is_available' => $this->foundingService->isAvailable(),
            ],
        ]);
    }
}

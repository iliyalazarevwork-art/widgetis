<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Http\Controllers\Api\V1\Widget;

use App\WidgetRuntime\Http\Requests\Widget\OnePlusOne\EvaluateRequest;
use App\WidgetRuntime\Models\Site;
use App\WidgetRuntime\Services\Widget\OnePlusOne\OnePlusOneService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

/**
 * POST /api/v1/widgets/one-plus-one/evaluate
 *
 * Evaluates the visitor's cart against the site's 1+1=3 promo and returns
 * swap instructions (which line items to replace with their 1 UAH clones).
 *
 * Site is resolved from the Origin/Referer header by the
 * `resolve.site.origin` middleware (stored as request attribute 'site').
 */
final class OnePlusOneEvaluateController
{
    public function __construct(
        private readonly OnePlusOneService $service,
    ) {
    }

    public function __invoke(EvaluateRequest $request): JsonResponse
    {
        /** @var Site $site */
        $site = $request->attributes->get('site');

        /** @var list<array{id: int, price: float, quantity: int, article?: string}> $cart */
        $cart = $request->validated('cart');

        Log::info('[OnePlusOne] Request', [
            'site_id' => $site->id,
            'items'   => count($cart),
        ]);

        return response()->json($this->service->evaluate($site, $cart));
    }
}

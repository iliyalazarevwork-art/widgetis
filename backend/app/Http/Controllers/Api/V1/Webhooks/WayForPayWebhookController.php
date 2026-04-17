<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Webhooks;

use App\Enums\PaymentProvider;
use App\Services\Billing\WayForPayService;
use App\Services\Billing\WebhookDispatcher;
use App\Services\Billing\Webhooks\InboundWebhook;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Public webhook endpoint for WayForPay serviceUrl callbacks.
 *
 * Delegates signature verification, parsing, and state transitions to
 * WebhookDispatcher (v2 path). The only provider-specific concern here
 * is the response body — WayForPay expects a signed JSON acknowledgement
 * or it keeps retrying delivery for 24h.
 */
class WayForPayWebhookController
{
    public function __construct(
        private readonly WebhookDispatcher $dispatcher,
        private readonly WayForPayService $wayForPayService,
    ) {
    }

    public function __invoke(Request $request): JsonResponse
    {
        $inbound = InboundWebhook::fromRequest($request);
        $outcome = $this->dispatcher->dispatch(PaymentProvider::WayForPay, $inbound);

        if (! $outcome->signatureValid) {
            return response()->json(['error' => 'invalid_signature'], 403);
        }

        $ack = $this->wayForPayService->buildWebhookResponse(
            orderReference: $outcome->reference ?? '',
            status: $outcome->processed ? 'accept' : 'ignored',
        );

        return response()->json($ack);
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Webhooks;

use App\Enums\PaymentProvider;
use App\Services\Billing\PaymentProviderRegistry;
use App\Services\Billing\WayForPayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Public webhook endpoint for WayForPay serviceUrl callbacks.
 *
 * The controller is intentionally thin: signature verification and all
 * state transitions happen inside WayForPayProvider (which delegates to
 * WayForPayWebhookService + SubscriptionActivationService). The only
 * provider-specific concern here is the response body — WayForPay expects
 * a signed JSON acknowledgement or it keeps retrying delivery for 24h.
 */
class WayForPayWebhookController
{
    public function __construct(
        private readonly PaymentProviderRegistry $providers,
        private readonly WayForPayService $wayForPayService,
    ) {
    }

    public function __invoke(Request $request): JsonResponse
    {
        $provider = $this->providers->get(PaymentProvider::WayForPay);
        $result = $provider->handleWebhook($request);

        if (! $result->signatureValid) {
            return response()->json(['error' => 'invalid_signature'], 403);
        }

        // WayForPay requires a signed ACK whose orderReference must match
        // the one it sent. Falling back to an empty reference on an
        // unknown order keeps the retry loop short — WFP accepts the ACK
        // and stops resending even though we logged the event as ignored.
        $ack = $this->wayForPayService->buildWebhookResponse(
            orderReference: $result->reference ?? '',
            status: 'accept',
        );

        return response()->json($ack);
    }
}

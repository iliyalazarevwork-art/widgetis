<?php

declare(strict_types=1);

namespace App\Core\Http\Controllers\Api\V1\Webhooks;

use App\Core\Services\Billing\WebhookDispatcher;
use App\Core\Services\Billing\Webhooks\InboundWebhook;
use App\Enums\PaymentProvider;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Public webhook endpoint for Monobank invoice status updates.
 *
 * Delegates signature verification, parsing, and state transitions to
 * WebhookDispatcher (v2 path). Monobank retries non-2xx responses for
 * up to 24h, so we respond 200 even on "ignored" outcomes and only return
 * 401 when the ECDSA signature fails.
 */
class MonobankWebhookController
{
    public function __construct(
        private readonly WebhookDispatcher $dispatcher,
    ) {
    }

    public function __invoke(Request $request): JsonResponse
    {
        $inbound = InboundWebhook::fromRequest($request);
        $outcome = $this->dispatcher->dispatch(PaymentProvider::Monobank, $inbound);

        if (! $outcome->signatureValid) {
            return response()->json(['error' => 'invalid_signature'], 403);
        }

        return response()->json([
            'status' => $outcome->processed ? 'ok' : 'ignored',
            'reference' => $outcome->reference,
        ]);
    }
}

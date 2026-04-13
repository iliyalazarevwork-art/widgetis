<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Webhooks;

use App\Enums\PaymentProvider;
use App\Services\Billing\PaymentProviderRegistry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Public webhook endpoint for Monobank invoice status updates.
 *
 * Signature verification, payload parsing, and state transitions are
 * delegated to MonobankProvider via the registry so this controller
 * stays a thin HTTP adapter. Monobank retries non-2xx responses for up
 * to 24h, so we respond 200 even on "ignored" outcomes (unknown
 * reference, duplicate success, intermediate statuses) and only return
 * 403 when the ECDSA signature fails.
 */
class MonobankWebhookController
{
    public function __construct(
        private readonly PaymentProviderRegistry $providers,
    ) {
    }

    public function __invoke(Request $request): JsonResponse
    {
        $provider = $this->providers->get(PaymentProvider::Monobank);
        $result = $provider->handleWebhook($request);

        if (! $result->signatureValid) {
            return response()->json(['error' => 'invalid_signature'], 403);
        }

        return response()->json([
            'status' => $result->processed ? 'ok' : 'ignored',
            'reference' => $result->reference,
        ]);
    }
}

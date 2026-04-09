<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Webhooks;

use App\Services\Billing\LiqPayWebhookService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class LiqPayWebhookController
{
    public function __construct(
        private readonly LiqPayWebhookService $webhookService,
    ) {
    }

    /**
     * Handle incoming LiqPay webhook (server_url callback).
     *
     * LiqPay always expects HTTP 200. Non-200 causes retries.
     */
    public function handle(Request $request): Response
    {
        $data = (string) $request->input('data', '');
        $signature = (string) $request->input('signature', '');

        $valid = $this->webhookService->process($data, $signature);

        if (! $valid) {
            Log::channel('payments')->warning('liqpay.webhook.invalid_signature', [
                'ip' => $request->ip(),
            ]);
        }

        // Always return 200 — LiqPay retries on non-200
        return response('OK');
    }
}

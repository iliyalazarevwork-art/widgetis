<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Services\Billing\LiqPayWebhookService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class LiqPayReturnController
{
    public function __construct(
        private readonly LiqPayWebhookService $webhookService,
    ) {
    }

    /**
     * Handle LiqPay result_url redirect.
     *
     * LiqPay POSTs payment data here after the user completes payment.
     * We process the payment immediately (same as server_url webhook),
     * then redirect the user to the frontend success page.
     *
     * This ensures the subscription is activated BEFORE the user lands
     * on /signup/success, so the frontend polling always succeeds.
     */
    public function handle(Request $request): RedirectResponse
    {
        $data = (string) $request->input('data', '');
        $signature = (string) $request->input('signature', '');

        if ($data !== '' && $signature !== '') {
            $valid = $this->webhookService->process($data, $signature);

            if (! $valid) {
                Log::channel('payments')->warning('liqpay.return.invalid_signature', [
                    'ip' => $request->ip(),
                ]);
            }
        }

        return redirect(rtrim((string) config('app.url'), '/') . '/signup/success');
    }
}

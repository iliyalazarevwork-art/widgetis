<?php

declare(strict_types=1);

namespace App\Services\Billing;

use App\Enums\BillingPeriod;
use App\Models\Order;
use App\Models\Plan;

class LiqPayService
{
    private const CHECKOUT_URL = 'https://www.liqpay.ua/api/3/checkout';
    private const API_VERSION = 3;

    private string $publicKey;
    private string $privateKey;
    private bool $sandbox;

    public function __construct()
    {
        $this->publicKey = (string) config('services.liqpay.public_key');
        $this->privateKey = (string) config('services.liqpay.private_key');
        $this->sandbox = (bool) config('services.liqpay.sandbox', true);
    }

    /**
     * Build LiqPay checkout payload for a subscription.
     * When $withTrial is true, the first charge is deferred by $trialDays.
     *
     * @return array{checkout_url: string, data: string, signature: string, order_id: string}
     */
    public function createSubscriptionCheckout(
        Order $order,
        Plan $plan,
        BillingPeriod $billingPeriod,
        string $serverUrl,
        string $resultUrl,
        bool $withTrial = false,
        ?int $trialDays = null,
    ): array {
        $amount = $billingPeriod === BillingPeriod::Yearly
            ? (float) $plan->price_yearly
            : (float) $plan->price_monthly;

        $periodicity = $billingPeriod === BillingPeriod::Yearly ? 'year' : 'month';

        $params = [
            'public_key' => $this->publicKey,
            'version' => self::API_VERSION,
            'action' => 'subscribe',
            'amount' => $amount,
            'currency' => 'UAH',
            'description' => "Widgetis: {$plan->slug} ({$billingPeriod->value})",
            'order_id' => $order->order_number,
            'subscribe_periodicity' => $periodicity,
            'server_url' => $serverUrl,
            'result_url' => $resultUrl,
        ];

        if ($this->sandbox) {
            $params['sandbox'] = 1;
        }

        if ($withTrial) {
            $days = max(0, (int) ($trialDays ?? $plan->trial_days ?? 7));
            // Defer first charge by configured trial days — user gets trial access, card is linked now.
            $params['subscribe_date_start'] = now()->addDays($days)->format('Y-m-d H:i:s');
        }

        $data = base64_encode((string) json_encode($params));
        $signature = $this->sign($data);

        return [
            'checkout_url' => self::CHECKOUT_URL,
            'data' => $data,
            'signature' => $signature,
            'order_id' => $order->order_number,
        ];
    }

    /**
     * Verify the HMAC signature sent by LiqPay in the webhook.
     */
    public function verifySignature(string $data, string $signature): bool
    {
        return hash_equals($this->sign($data), $signature);
    }

    /**
     * Decode the base64-encoded JSON payload from LiqPay callback.
     *
     * @return array<string, mixed>
     */
    public function decodeCallbackData(string $data): array
    {
        $decoded = base64_decode($data, strict: true);

        if ($decoded === false) {
            return [];
        }

        return (array) (json_decode($decoded, true) ?? []);
    }

    /**
     * Cancel a recurring LiqPay subscription by its subscribe_order_id.
     * Returns true on success, false if LiqPay returned an error.
     */
    public function cancelSubscription(string $subscribeOrderId): bool
    {
        $params = [
            'public_key' => $this->publicKey,
            'version'    => self::API_VERSION,
            'action'     => 'unsubscribe',
            'order_id'   => $subscribeOrderId,
        ];

        $data      = base64_encode((string) json_encode($params));
        $signature = $this->sign($data);

        $response = \Illuminate\Support\Facades\Http::asForm()->post(
            'https://www.liqpay.ua/api/request',
            ['data' => $data, 'signature' => $signature],
        );

        $body = $response->json() ?? [];

        return ($body['status'] ?? '') !== 'error';
    }

    private function sign(string $data): string
    {
        return base64_encode(sha1($this->privateKey . $data . $this->privateKey, true));
    }
}

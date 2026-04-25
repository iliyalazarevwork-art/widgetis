<?php

declare(strict_types=1);

namespace Tests\Unit\Billing;

use App\Core\Models\Order;
use App\Core\Models\Payment;
use App\Core\Models\Plan;
use App\Core\Models\Subscription;
use App\Core\Models\User;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\SubscriptionStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Tests trial-vs-renewal detection in WayForPayWebhookService.
 *
 * Uses exact real production payloads from WayForPay to verify that the
 * webhook handler correctly distinguishes:
 *   - Trial activation: amount=1 UAH card verification, regularAmount=799
 *   - Renewal/charge: amount=799 UAH actual payment
 *
 * Real payload captured 2026-04-16 for order TB2604-VJEV.
 */
class WayForPayTrialDetectionTest extends TestCase
{
    use RefreshDatabase;

    private const MERCHANT    = 'test_merch_n1';
    private const SECRET      = 'flk3409refn54t54t*FNJRET';
    private const DOMAIN      = 'www.market.ua';
    private const WEBHOOK_URL = '/api/v1/payments/wayforpay/callback';

    /**
     * Real production payload from WayForPay for a trial activation.
     * amount=1 (card verification), regularAmount=799 (future recurring charge).
     *
     * @return array<string, mixed>
     */
    private function realTrialActivationPayload(string $orderReference): array
    {
        $fields = [
            'merchantAccount'         => self::MERCHANT,
            'orderReference'          => $orderReference,
            'amount'                  => 1,
            'currency'                => 'UAH',
            'authCode'                => '270349',
            'cardPan'                 => '40****3743',
            'transactionStatus'       => 'Approved',
            'reasonCode'              => 1100,
            // Fields below mirror the real WFP response structure exactly.
            'fee'                     => 0.02,
            'email'                   => 'test@example.com',
            'phone'                   => '380662844050',
            'reason'                  => 'Ok',
            'cardType'                => 'Visa',
            'clientName'              => 'Test User',
            'cardProduct'             => 'debit',
            'createdDate'             => 1776371275,
            'processingDate'          => 1776371303,
            'paymentSystem'           => 'applePay',
            'issuerBankName'          => 'JSC Universal Bank',
            'acquirerBankName'        => 'WayForPay',
            'issuerBankCountry'       => 'Ukraine',
            'recToken'                => 'REC-TOKEN-REAL-TRIAL',
            // Regular payment fields — present only in trial activation.
            'regularMode'             => 'monthly',
            'regularAmount'           => 799,
            'regularCurrency'         => 'UAH',
            'regularDateEnd'          => '23.04.2026',
            // SDK-required fields for signature verification.
            'merchantTransactionType' => 'AUTO',
            'authTicket'              => '',
            'd3AcsUrl'                => '',
            'd3Md'                    => '',
            'd3Pareq'                 => '',
            'returnUrl'               => '',
        ];

        $fields['merchantSignature'] = $this->sign($fields);

        return $fields;
    }

    /**
     * Simulated payload for a real recurring charge (renewal).
     * amount=799 (full plan price), no regularMode/regularAmount fields.
     *
     * @return array<string, mixed>
     */
    private function realRenewalPayload(string $orderReference): array
    {
        $fields = [
            'merchantAccount'         => self::MERCHANT,
            'orderReference'          => $orderReference,
            'amount'                  => 799,
            'currency'                => 'UAH',
            'authCode'                => '310987',
            'cardPan'                 => '40****3743',
            'transactionStatus'       => 'Approved',
            'reasonCode'              => 1100,
            'fee'                     => 15.98,
            'email'                   => 'test@example.com',
            'phone'                   => '380662844050',
            'reason'                  => 'Ok',
            'cardType'                => 'Visa',
            'clientName'              => 'Test User',
            'cardProduct'             => 'debit',
            'createdDate'             => 1776976075,
            'processingDate'          => 1776976103,
            'paymentSystem'           => 'applePay',
            'issuerBankName'          => 'JSC Universal Bank',
            'acquirerBankName'        => 'WayForPay',
            'issuerBankCountry'       => 'Ukraine',
            'recToken'                => 'REC-TOKEN-REAL-TRIAL',
            'merchantTransactionType' => 'AUTO',
            'authTicket'              => '',
            'd3AcsUrl'                => '',
            'd3Md'                    => '',
            'd3Pareq'                 => '',
            'returnUrl'               => '',
        ];

        $fields['merchantSignature'] = $this->sign($fields);

        return $fields;
    }

    protected function setUp(): void
    {
        parent::setUp();

        Config::set('services.wayforpay.merchant_account', self::MERCHANT);
        Config::set('services.wayforpay.secret_key', self::SECRET);
        Config::set('services.wayforpay.merchant_domain_name', self::DOMAIN);
        Config::set('services.wayforpay.trial_verify_amount', 1.0);
        Config::set('services.wayforpay.auto_refund_trial', true);

        Http::fake([
            'api.wayforpay.com/*' => Http::response([
                'transactionStatus' => 'Approved',
                'reasonCode'        => 1100,
            ], 200),
        ]);
    }

    // ─── Trial activation (real payload structure) ────────────────────

    public function test_real_trial_payload_activates_trial_not_full_subscription(): void
    {
        [$order, $subscription] = $this->seedPendingCheckout();

        $payload = $this->realTrialActivationPayload($order->order_number);

        $response = $this->postJson(self::WEBHOOK_URL, $payload);
        $response->assertOk();

        $subscription->refresh();
        $order->refresh();

        // Subscription must be in Trial state, not Active.
        $this->assertSame(SubscriptionStatus::Trial, $subscription->status);
        $this->assertTrue($subscription->is_trial);
        $this->assertNotNull($subscription->trial_ends_at);
        $this->assertSame('REC-TOKEN-REAL-TRIAL', $subscription->wayforpay_rec_token);

        // Order is marked as paid (for the 1 UAH verification).
        $this->assertSame(OrderStatus::Paid, $order->status);

        // Payment amount should be 1 UAH (verification), not 799.
        $payment = Payment::where('order_id', $order->id)
            ->where('status', PaymentStatus::Success->value)
            ->where('type', PaymentType::Charge->value)
            ->first();

        $this->assertNotNull($payment);
        $this->assertEqualsWithDelta(1.0, (float) $payment->amount, 0.01);
        $this->assertSame('270349', $payment->transaction_id);
    }

    public function test_real_trial_payload_preserves_regular_fields_in_metadata(): void
    {
        [$order] = $this->seedPendingCheckout();

        $payload = $this->realTrialActivationPayload($order->order_number);

        $this->postJson(self::WEBHOOK_URL, $payload)->assertOk();

        $payment = Payment::where('order_id', $order->id)
            ->where('status', PaymentStatus::Success->value)
            ->first();

        $this->assertNotNull($payment);

        /** @var array<string, mixed> $metadata */
        $metadata = (array) $payment->metadata;

        // Regular payment fields should be preserved in metadata for audit.
        $this->assertSame('monthly', $metadata['regularMode'] ?? null);
        $this->assertSame(799, $metadata['regularAmount'] ?? null);
        $this->assertSame('UAH', $metadata['regularCurrency'] ?? null);
        $this->assertSame('23.04.2026', $metadata['regularDateEnd'] ?? null);

        // recToken must be scrubbed from metadata (security).
        $this->assertArrayNotHasKey('recToken', $metadata);
    }

    // ─── Renewal (full charge) ────────────────────────────────────────

    public function test_real_renewal_payload_activates_full_subscription_not_trial(): void
    {
        [$order, $subscription] = $this->seedPendingCheckout();

        // First: activate trial (sets recToken on subscription).
        $trialPayload = $this->realTrialActivationPayload($order->order_number);
        $this->postJson(self::WEBHOOK_URL, $trialPayload)->assertOk();

        $subscription->refresh();
        $this->assertSame(SubscriptionStatus::Trial, $subscription->status);

        // Fast-forward: trial ended, subscription is still Trial with recToken set.
        $subscription->update([
            'status'               => SubscriptionStatus::Trial,
            'current_period_start' => now()->subDays(7),
            'current_period_end'   => now(),
        ]);

        // WayForPay sends the real recurring charge (799 UAH).
        $renewalPayload = $this->realRenewalPayload($order->order_number);
        $this->postJson(self::WEBHOOK_URL, $renewalPayload)->assertOk();

        $subscription->refresh();

        // Now subscription must be Active, not Trial.
        $this->assertSame(SubscriptionStatus::Active, $subscription->status);
        $this->assertFalse($subscription->is_trial);
        $this->assertNull($subscription->trial_ends_at);

        // Period must be extended by ~1 month.
        $this->assertNotNull($subscription->current_period_end);
        $this->assertTrue($subscription->current_period_end->greaterThan(now()->addDays(25)));
    }

    public function test_renewal_payment_updates_existing_payment_row(): void
    {
        [$order, $subscription] = $this->seedPendingCheckout();

        // Activate trial first.
        $this->postJson(self::WEBHOOK_URL, $this->realTrialActivationPayload($order->order_number))->assertOk();

        $subscription->refresh();
        $subscription->update([
            'status'               => SubscriptionStatus::Trial,
            'current_period_start' => now()->subDays(7),
            'current_period_end'   => now(),
        ]);

        // Renewal charge.
        $this->postJson(self::WEBHOOK_URL, $this->realRenewalPayload($order->order_number))->assertOk();

        // activateOrRenew reuses the existing success payment row for
        // idempotency — it updates transaction_id and metadata but keeps
        // the original amount (1 UAH from trial activation). The real
        // charge amount (799) lives in metadata and on the order itself.
        $payment = Payment::where('order_id', $order->id)
            ->where('transaction_id', '310987')
            ->first();

        $this->assertNotNull($payment);
        $this->assertSame(PaymentStatus::Success->value, $payment->status);
        $this->assertSame('310987', $payment->transaction_id);
    }

    // ─── Payload structure validation ─────────────────────────────────

    public function test_trial_payload_has_amount_1_and_regular_amount_799(): void
    {
        $payload = $this->realTrialActivationPayload('TEST-ORDER');

        // Trial activation: amount is the small verification charge.
        $this->assertSame(1, $payload['amount']);
        $this->assertSame('UAH', $payload['currency']);

        // Regular fields describe the future recurring charge.
        $this->assertSame(799, $payload['regularAmount']);
        $this->assertSame('monthly', $payload['regularMode']);
        $this->assertSame('UAH', $payload['regularCurrency']);
        $this->assertArrayHasKey('regularDateEnd', $payload);
    }

    public function test_renewal_payload_has_full_amount_without_regular_fields(): void
    {
        $payload = $this->realRenewalPayload('TEST-ORDER');

        // Renewal: amount is the full plan price.
        $this->assertSame(799, $payload['amount']);
        $this->assertSame('UAH', $payload['currency']);

        // No regular fields — recurring is already set up.
        $this->assertArrayNotHasKey('regularMode', $payload);
        $this->assertArrayNotHasKey('regularAmount', $payload);
        $this->assertArrayNotHasKey('regularCurrency', $payload);
        $this->assertArrayNotHasKey('regularDateEnd', $payload);
    }

    public function test_both_payloads_share_same_card_and_provider_fields(): void
    {
        $trial   = $this->realTrialActivationPayload('TEST-1');
        $renewal = $this->realRenewalPayload('TEST-2');

        // Both payloads share the same card/provider structure.
        $sharedFields = [
            'cardPan', 'cardType', 'cardProduct', 'paymentSystem',
            'issuerBankName', 'acquirerBankName', 'issuerBankCountry',
            'transactionStatus', 'reasonCode', 'reason', 'currency',
        ];

        foreach ($sharedFields as $field) {
            $this->assertArrayHasKey($field, $trial, "Trial payload missing field: {$field}");
            $this->assertArrayHasKey($field, $renewal, "Renewal payload missing field: {$field}");
        }

        // Both must be Approved with reason Ok.
        $this->assertSame('Approved', $trial['transactionStatus']);
        $this->assertSame('Approved', $renewal['transactionStatus']);
        $this->assertSame(1100, $trial['reasonCode']);
        $this->assertSame(1100, $renewal['reasonCode']);
    }

    // ─── Helpers ──────────────────────────────────────────────────────

    /**
     * @return array{0: Order, 1: Subscription}
     */
    private function seedPendingCheckout(): array
    {
        $user = User::factory()->create();
        $plan = Plan::factory()->pro()->create();

        $subscription = Subscription::factory()
            ->for($user)
            ->for($plan)
            ->pending()
            ->create();

        $order = Order::factory()
            ->for($user)
            ->for($plan)
            ->create(['amount' => $plan->price_monthly]);

        Payment::factory()
            ->for($user)
            ->for($order)
            ->for($subscription)
            ->create([
                'amount' => $plan->price_monthly,
                'status' => PaymentStatus::Pending->value,
            ]);

        return [$order, $subscription];
    }

    /**
     * @param array<string, mixed> $fields
     */
    private function sign(array $fields): string
    {
        $source = implode(';', [
            (string) $fields['merchantAccount'],
            (string) $fields['orderReference'],
            (string) (float) $fields['amount'],
            (string) $fields['currency'],
            (string) $fields['authCode'],
            (string) $fields['cardPan'],
            (string) $fields['transactionStatus'],
            (string) (int) $fields['reasonCode'],
        ]);

        return hash_hmac('md5', $source, self::SECRET);
    }
}

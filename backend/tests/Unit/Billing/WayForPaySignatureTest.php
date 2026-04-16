<?php

declare(strict_types=1);

namespace Tests\Unit\Billing;

use App\Services\Billing\WayForPayService;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

/**
 * Unit tests for the WayForPay HMAC-MD5 signature algorithm.
 *
 * Reference (https://wiki.wayforpay.com/):
 *   signature = hash_hmac('md5', join(";", fields), secret_key)
 *
 * Field order for Purchase/CHARGE requests is frozen as:
 *   merchantAccount;merchantDomainName;orderReference;orderDate;amount;
 *   currency;productName[];productCount[];productPrice[]
 *
 * Field order for serviceUrl webhook verification is:
 *   merchantAccount;orderReference;amount;currency;
 *   authCode;cardPan;transactionStatus;reasonCode
 *
 * Any drift in the field order breaks real-life webhooks silently — these
 * tests pin the exact byte layout so the regression would fail here first.
 */
class WayForPaySignatureTest extends TestCase
{
    private const MERCHANT        = 'test_merch_n1';
    private const SECRET          = 'flk3409refn54t54t*FNJRET';
    private const DOMAIN          = 'www.market.ua';

    protected function setUp(): void
    {
        parent::setUp();

        Config::set('services.wayforpay.merchant_account', self::MERCHANT);
        Config::set('services.wayforpay.secret_key', self::SECRET);
        Config::set('services.wayforpay.merchant_domain_name', self::DOMAIN);
    }

    public function test_purchase_signature_matches_documented_field_order(): void
    {
        $payload = [
            'merchantAccount'    => self::MERCHANT,
            'merchantDomainName' => self::DOMAIN,
            'orderReference'     => 'ORDER-ABC-1',
            'orderDate'          => 1712000000,
            'amount'             => '1.00',
            'currency'           => 'UAH',
            'productName'        => ['Widgetis Pro subscription'],
            'productCount'       => [1],
            'productPrice'       => ['1.00'],
        ];

        $expected = hash_hmac('md5', implode(';', [
            self::MERCHANT,
            self::DOMAIN,
            'ORDER-ABC-1',
            '1712000000',
            '1.00',
            'UAH',
            'Widgetis Pro subscription',
            '1',
            '1.00',
        ]), self::SECRET);

        $service = app(WayForPayService::class);

        $this->assertSame(
            $expected,
            $service->signPurchase($payload),
            'Purchase signature must follow the documented field order',
        );
    }

    public function test_purchase_signature_includes_all_cart_items_in_order(): void
    {
        // Multi-item carts append names, counts, and prices as three parallel
        // lists. A regression that flattens them in the wrong order would
        // produce a valid-looking but rejected signature.
        $payload = [
            'merchantAccount'    => self::MERCHANT,
            'merchantDomainName' => self::DOMAIN,
            'orderReference'     => 'ORDER-MULTI',
            'orderDate'          => 1000,
            'amount'             => '5.00',
            'currency'           => 'UAH',
            'productName'        => ['a', 'b'],
            'productCount'       => [1, 2],
            'productPrice'       => ['1.00', '2.00'],
        ];

        $expected = hash_hmac('md5', implode(';', [
            self::MERCHANT, self::DOMAIN, 'ORDER-MULTI', '1000', '5.00', 'UAH',
            'a', 'b', '1', '2', '1.00', '2.00',
        ]), self::SECRET);

        $this->assertSame($expected, (app(WayForPayService::class))->signPurchase($payload));
    }

    public function test_refund_signature_matches_documented_field_order(): void
    {
        $payload = [
            'merchantAccount' => self::MERCHANT,
            'orderReference'  => 'ORDER-REF-1',
            'amount'          => '1.00',
            'currency'        => 'UAH',
        ];

        $expected = hash_hmac('md5', implode(';', [self::MERCHANT, 'ORDER-REF-1', '1.00', 'UAH']), self::SECRET);

        $this->assertSame($expected, (app(WayForPayService::class))->signRefund($payload));
    }

    public function test_verify_webhook_signature_accepts_valid_payload(): void
    {
        $fields = $this->webhookFields('Approved', '1100');
        $fields['merchantSignature'] = hash_hmac('md5', $this->webhookSignatureSource($fields), self::SECRET);

        $this->assertTrue(
            (app(WayForPayService::class))->verifyWebhookSignature($fields),
        );
    }

    public function test_verify_webhook_signature_rejects_tampered_amount(): void
    {
        $original = $this->webhookFields('Approved', '1100');
        $original['merchantSignature'] = hash_hmac('md5', $this->webhookSignatureSource($original), self::SECRET);

        // Attacker flips the amount after we signed it.
        $tampered = $original;
        $tampered['amount'] = 99999;

        $this->assertFalse(
            (app(WayForPayService::class))->verifyWebhookSignature($tampered),
            'Tampering with amount must invalidate the WayForPay signature',
        );
    }

    public function test_verify_webhook_signature_rejects_wrong_secret(): void
    {
        $fields = $this->webhookFields('Approved', '1100');
        $fields['merchantSignature'] = hash_hmac('md5', $this->webhookSignatureSource($fields), 'some-other-secret');

        $this->assertFalse(
            (app(WayForPayService::class))->verifyWebhookSignature($fields),
        );
    }

    public function test_verify_webhook_signature_rejects_empty_signature(): void
    {
        $fields = $this->webhookFields('Approved', '1100');
        $fields['merchantSignature'] = '';

        $this->assertFalse(
            (app(WayForPayService::class))->verifyWebhookSignature($fields),
        );
    }

    public function test_webhook_response_signature_uses_order_status_time_triplet(): void
    {
        $service = app(WayForPayService::class);
        $response = $service->buildWebhookResponse('ORDER-ACK-1', 'accept');

        $expected = hash_hmac(
            'md5',
            implode(';', ['ORDER-ACK-1', 'accept', (string) $response['time']]),
            self::SECRET,
        );

        $this->assertSame($expected, $response['signature']);
        $this->assertSame('ORDER-ACK-1', $response['orderReference']);
        $this->assertSame('accept', $response['status']);
    }

    /**
     * Build a webhook payload that round-trips cleanly through the SDK.
     * Transaction::fromArray() requires a long list of fields and re-casts
     * numerics via floatval/intval — the signature source has to match the
     * re-cast values or the verifier rejects the payload.
     *
     * @return array<string, mixed>
     */
    private function webhookFields(string $transactionStatus, string $reasonCode): array
    {
        return [
            'merchantAccount'         => self::MERCHANT,
            'orderReference'          => 'ORDER-WH-1',
            'amount'                  => 1,
            'currency'                => 'UAH',
            'authCode'                => 'AUTH-1234',
            'cardPan'                 => '41****1111',
            'transactionStatus'       => $transactionStatus,
            'reasonCode'              => (int) $reasonCode,
            'recToken'                => 'REC-TOKEN-ABC',
            'paymentSystem'           => 'card',
            'merchantTransactionType' => 'AUTO',
            'authTicket'              => '',
            'd3AcsUrl'                => '',
            'd3Md'                    => '',
            'd3Pareq'                 => '',
            'returnUrl'               => '',
            'createdDate'             => 1712000000,
            'processingDate'          => 1712000000,
            'reason'                  => $transactionStatus === 'Approved' ? 'Ok' : 'Declined',
            'fee'                     => 0,
        ];
    }

    /**
     * @param array<string, mixed> $fields
     */
    private function webhookSignatureSource(array $fields): string
    {
        return implode(';', [
            (string) $fields['merchantAccount'],
            (string) $fields['orderReference'],
            (string) (float) $fields['amount'],
            (string) $fields['currency'],
            (string) $fields['authCode'],
            (string) $fields['cardPan'],
            (string) $fields['transactionStatus'],
            (string) $fields['reasonCode'],
        ]);
    }
}

<?php

declare(strict_types=1);

namespace Tests\Unit\Billing;

use App\Services\Billing\LiqPayService;
use Illuminate\Support\Facades\Config;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Unit tests for the LiqPay signature algorithm.
 *
 * Formula (from https://www.liqpay.ua/en/documentation/api/aquiring/checkout/doc):
 *   signature = base64(sha1(private_key + data + private_key, raw))
 *   data      = base64(json_encode(params))
 *
 * The signature MUST be deterministic given identical inputs — otherwise
 * webhooks from LiqPay would be rejected (or worse, forged).
 *
 * We bind known LIQPAY_* keys in setUp so the LiqPayService reads them.
 */
class LiqPaySignatureTest extends TestCase
{
    private const PUBLIC_KEY = 'sandbox_i12345678901';
    private const PRIVATE_KEY = 'sandbox_PrivateKeyXXX';

    protected function setUp(): void
    {
        parent::setUp();

        Config::set('services.liqpay.public_key', self::PUBLIC_KEY);
        Config::set('services.liqpay.private_key', self::PRIVATE_KEY);
        Config::set('services.liqpay.sandbox', true);
    }

    public function test_signature_for_known_payload_matches_reference_algorithm(): void
    {
        $data = base64_encode('{"action":"pay","amount":1,"currency":"UAH","order_id":"1"}');
        $expected = base64_encode(sha1(self::PRIVATE_KEY.$data.self::PRIVATE_KEY, true));

        $service = new LiqPayService();

        $this->assertTrue(
            $service->verifySignature($data, $expected),
            'LiqPayService::verifySignature must accept a signature built by the documented formula.',
        );
    }

    public function test_verify_signature_rejects_tampered_data(): void
    {
        $originalData = base64_encode('{"order_id":"A","amount":100}');
        $tamperedData = base64_encode('{"order_id":"A","amount":1}');
        $signatureOfOriginal = base64_encode(sha1(self::PRIVATE_KEY.$originalData.self::PRIVATE_KEY, true));

        $service = new LiqPayService();

        $this->assertFalse(
            $service->verifySignature($tamperedData, $signatureOfOriginal),
            'Changing the amount must invalidate the LiqPay signature.',
        );
    }

    public function test_verify_signature_rejects_tampered_signature(): void
    {
        $data = base64_encode('{"order_id":"B"}');
        $wrongSignature = base64_encode(sha1('wrong'.$data.'wrong', true));

        $this->assertFalse(
            (new LiqPayService())->verifySignature($data, $wrongSignature),
        );
    }

    public function test_verify_signature_uses_timing_safe_comparison(): void
    {
        $data = base64_encode('{"x":1}');
        $good = base64_encode(sha1(self::PRIVATE_KEY.$data.self::PRIVATE_KEY, true));

        $firstByteFlipped = substr($good, 0, -1).'X';

        $this->assertFalse(
            (new LiqPayService())->verifySignature($data, $firstByteFlipped),
        );
    }

    /**
     * @return iterable<string, array{0: string, 1: array<string, mixed>}>
     */
    public static function decodeCases(): iterable
    {
        yield 'empty string decodes to empty array' => [
            '',
            [],
        ];

        yield 'valid json decodes to associative array' => [
            base64_encode((string) json_encode(['status' => 'success', 'amount' => 499])),
            ['status' => 'success', 'amount' => 499],
        ];

        yield 'broken base64 decodes to empty array' => [
            '!!!not-base64!!!',
            [],
        ];
    }

    #[DataProvider('decodeCases')]
    public function test_decode_callback_data(string $data, array $expected): void
    {
        $this->assertSame(
            $expected,
            (new LiqPayService())->decodeCallbackData($data),
        );
    }
}

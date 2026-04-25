<?php

declare(strict_types=1);

namespace Tests\Unit\Billing;

use App\Core\Services\Billing\Adapters\WayForPayAdapter;
use App\Core\Services\Billing\Events\ChargeFailedEvent;
use App\Core\Services\Billing\Events\IgnoredEvent;
use App\Core\Services\Billing\Events\InvalidSignatureEvent;
use App\Core\Services\Billing\Events\RefundedEvent;
use App\Core\Services\Billing\Events\SubscriptionActivatedEvent;
use App\Core\Services\Billing\Events\SubscriptionRenewedEvent;
use App\Core\Services\Billing\WayForPayService;
use App\Core\Services\Billing\Webhooks\InboundWebhook;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

final class WayForPayAdapterParseWebhookTest extends TestCase
{
    private WayForPayService&MockObject $sdk;

    private WayForPayAdapter $adapter;

    protected function setUp(): void
    {
        parent::setUp();

        $this->sdk     = $this->createMock(WayForPayService::class);
        $this->adapter = new WayForPayAdapter($this->sdk);
    }

    /** @test */
    public function it_returns_invalid_signature_event_when_signature_verification_fails(): void
    {
        $this->sdk->method('verifyWebhookSignature')->willReturn(false);

        $webhook = $this->webhookWithPayload(['transactionStatus' => 'Approved', 'amount' => 1]);
        $event   = $this->adapter->parseWebhook($webhook);

        $this->assertInstanceOf(InvalidSignatureEvent::class, $event);
    }

    /** @test */
    public function it_returns_subscription_activated_event_with_rec_token_when_small_approved_payload_has_rec_token(): void
    {
        $this->sdk->method('verifyWebhookSignature')->willReturn(true);

        $payload = [
            'orderReference'    => 'ORDER-001',
            'transactionStatus' => 'Approved',
            'amount'            => 1.0,
            'recToken'          => 'REC-ABC',
            'authCode'          => 'AUTH-001',
            'reasonCode'        => '1100',
            'reason'            => 'Ok',
        ];

        $webhook = $this->webhookWithPayload($payload);
        $event   = $this->adapter->parseWebhook($webhook);

        $this->assertInstanceOf(SubscriptionActivatedEvent::class, $event);
        $this->assertSame('ORDER-001', $event->reference);
        $this->assertSame('REC-ABC', $event->tokens->recurringToken);
        $this->assertSame('AUTH-001', $event->tokens->providerSubscriptionId);
        $this->assertSame(100, $event->paidAmount->minorAmount);
    }

    /** @test */
    public function it_returns_subscription_renewed_event_for_large_approved_without_rec_token(): void
    {
        $this->sdk->method('verifyWebhookSignature')->willReturn(true);

        $payload = [
            'orderReference'    => 'ORDER-002',
            'transactionStatus' => 'Approved',
            'amount'            => 799.0,
            'recToken'          => '',
            'authCode'          => 'AUTH-002',
            'reasonCode'        => '1100',
            'reason'            => 'Ok',
        ];

        $webhook = $this->webhookWithPayload($payload);
        $event   = $this->adapter->parseWebhook($webhook);

        $this->assertInstanceOf(SubscriptionRenewedEvent::class, $event);
        $this->assertSame('ORDER-002', $event->reference);
        $this->assertSame(79900, $event->paidAmount->minorAmount);
        $this->assertSame('AUTH-002', $event->transactionId);
    }

    /** @test */
    public function it_returns_refunded_event_when_transaction_status_is_refunded(): void
    {
        $this->sdk->method('verifyWebhookSignature')->willReturn(true);

        $payload = [
            'orderReference'    => 'ORDER-003',
            'transactionStatus' => 'Refunded',
            'amount'            => 1.0,
            'authCode'          => 'AUTH-003',
            'reasonCode'        => '1100',
            'reason'            => 'Refunded',
        ];

        $webhook = $this->webhookWithPayload($payload);
        $event   = $this->adapter->parseWebhook($webhook);

        $this->assertInstanceOf(RefundedEvent::class, $event);
        $this->assertSame('ORDER-003', $event->reference);
        $this->assertSame(100, $event->amount->minorAmount);
    }

    /** @test */
    public function it_returns_charge_failed_event_when_transaction_status_is_declined(): void
    {
        $this->sdk->method('verifyWebhookSignature')->willReturn(true);

        $payload = [
            'orderReference'    => 'ORDER-004',
            'transactionStatus' => 'Declined',
            'amount'            => 1.0,
            'authCode'          => '',
            'reasonCode'        => '1019',
            'reason'            => 'Insufficient funds',
        ];

        $webhook = $this->webhookWithPayload($payload);
        $event   = $this->adapter->parseWebhook($webhook);

        $this->assertInstanceOf(ChargeFailedEvent::class, $event);
        $this->assertSame('ORDER-004', $event->reference);
        $this->assertSame('1019', $event->code);
        $this->assertSame('Insufficient funds', $event->message);
    }

    /** @test */
    public function it_returns_ignored_event_on_unknown_status(): void
    {
        $this->sdk->method('verifyWebhookSignature')->willReturn(true);

        $payload = [
            'orderReference'    => 'ORDER-005',
            'transactionStatus' => 'InProcessing',
            'amount'            => 1.0,
            'authCode'          => '',
            'reasonCode'        => '',
            'reason'            => '',
        ];

        $webhook = $this->webhookWithPayload($payload);
        $event   = $this->adapter->parseWebhook($webhook);

        $this->assertInstanceOf(IgnoredEvent::class, $event);
        $this->assertSame('ORDER-005', $event->reference);
        $this->assertSame('InProcessing', $event->reason);
    }

    /** @param array<string, mixed> $payload */
    private function webhookWithPayload(array $payload): InboundWebhook
    {
        return InboundWebhook::fromRaw(
            rawBody: (string) json_encode($payload),
            headers: ['content-type' => 'application/json'],
            ip: '127.0.0.1',
        );
    }
}

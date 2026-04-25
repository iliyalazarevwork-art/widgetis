<?php

declare(strict_types=1);

namespace Tests\Unit\Billing;

use App\Core\Services\Billing\Adapters\MonobankAdapter;
use App\Core\Services\Billing\Adapters\MonobankAdapterConfig;
use App\Core\Services\Billing\Events\ChargeFailedEvent;
use App\Core\Services\Billing\Events\IgnoredEvent;
use App\Core\Services\Billing\Events\InvalidSignatureEvent;
use App\Core\Services\Billing\Events\SubscriptionActivatedEvent;
use App\Core\Services\Billing\Events\SubscriptionRenewedEvent;
use App\Core\Services\Billing\MonobankWebhookService;
use App\Core\Services\Billing\Webhooks\InboundWebhook;
use AratKruglik\Monobank\Contracts\ClientInterface as MonobankClient;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

final class MonobankAdapterParseWebhookTest extends TestCase
{
    private MonobankClient&MockObject $client;

    private MonobankWebhookService&MockObject $webhookService;

    private MonobankAdapter $adapter;

    protected function setUp(): void
    {
        parent::setUp();

        $this->client         = $this->createMock(MonobankClient::class);
        $this->webhookService = $this->createMock(MonobankWebhookService::class);

        $config = new MonobankAdapterConfig(
            hasToken: true,
            webhookUrl: 'https://example.com/webhook',
            redirectUrl: 'https://example.com/return',
        );

        $this->adapter = new MonobankAdapter($this->client, $config, $this->webhookService);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_returns_invalid_signature_event_when_signature_is_invalid(): void
    {
        $this->webhookService->method('verifyRawSignature')->willReturn(false);

        $webhook = $this->webhookWithPayload(['status' => 'success', 'invoiceId' => 'INV-001']);
        $event   = $this->adapter->parseWebhook($webhook);

        $this->assertInstanceOf(InvalidSignatureEvent::class, $event);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_returns_subscription_activated_event_when_success_with_reference(): void
    {
        $this->webhookService->method('verifyRawSignature')->willReturn(true);

        $payload = [
            'status'         => 'success',
            'invoiceId'      => 'INV-002',
            'reference'      => 'ORDER-MONO-002',
            'subscriptionId' => 'MONO-SUB-002',
            'amount'         => 79900,
        ];

        $webhook = $this->webhookWithPayload($payload);
        $event   = $this->adapter->parseWebhook($webhook);

        $this->assertInstanceOf(SubscriptionActivatedEvent::class, $event);
        $this->assertSame('ORDER-MONO-002', $event->reference);
        $this->assertSame('MONO-SUB-002', $event->tokens->providerSubscriptionId);
        $this->assertSame('INV-002', $event->transactionId);
        $this->assertSame(79900, $event->paidAmount->minorAmount);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_returns_subscription_renewed_event_for_charge_success_without_reference(): void
    {
        $this->webhookService->method('verifyRawSignature')->willReturn(true);

        $payload = [
            'status'         => 'success',
            'invoiceId'      => 'INV-003',
            'subscriptionId' => 'MONO-SUB-003',
            'amount'         => 79900,
        ];

        $webhook = $this->webhookWithPayload($payload);
        $event   = $this->adapter->parseWebhook($webhook);

        $this->assertInstanceOf(SubscriptionRenewedEvent::class, $event);
        $this->assertSame(79900, $event->paidAmount->minorAmount);
        $this->assertSame('INV-003', $event->transactionId);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_returns_charge_failed_event_for_failure_status(): void
    {
        $this->webhookService->method('verifyRawSignature')->willReturn(true);

        $payload = [
            'status'    => 'failure',
            'invoiceId' => 'INV-004',
            'reference' => 'ORDER-MONO-004',
            'amount'    => 0,
        ];

        $webhook = $this->webhookWithPayload($payload);
        $event   = $this->adapter->parseWebhook($webhook);

        $this->assertInstanceOf(ChargeFailedEvent::class, $event);
        $this->assertSame('ORDER-MONO-004', $event->reference);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_returns_charge_failed_event_for_reversed_status(): void
    {
        $this->webhookService->method('verifyRawSignature')->willReturn(true);

        $payload = [
            'status'    => 'reversed',
            'invoiceId' => 'INV-005',
            'reference' => 'ORDER-MONO-005',
            'amount'    => 0,
        ];

        $webhook = $this->webhookWithPayload($payload);
        $event   = $this->adapter->parseWebhook($webhook);

        $this->assertInstanceOf(ChargeFailedEvent::class, $event);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_returns_ignored_event_for_processing_status(): void
    {
        $this->webhookService->method('verifyRawSignature')->willReturn(true);

        $payload = [
            'status'    => 'processing',
            'invoiceId' => 'INV-006',
            'amount'    => 0,
        ];

        $webhook = $this->webhookWithPayload($payload);
        $event   = $this->adapter->parseWebhook($webhook);

        $this->assertInstanceOf(IgnoredEvent::class, $event);
        $this->assertSame('processing', $event->reason);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_returns_ignored_event_for_unknown_status(): void
    {
        $this->webhookService->method('verifyRawSignature')->willReturn(true);

        $payload = [
            'status'    => 'created',
            'invoiceId' => 'INV-007',
            'amount'    => 0,
        ];

        $webhook = $this->webhookWithPayload($payload);
        $event   = $this->adapter->parseWebhook($webhook);

        $this->assertInstanceOf(IgnoredEvent::class, $event);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_uses_final_amount_over_amount_when_present(): void
    {
        $this->webhookService->method('verifyRawSignature')->willReturn(true);

        $payload = [
            'status'         => 'success',
            'invoiceId'      => 'INV-008',
            'reference'      => 'ORDER-MONO-008',
            'subscriptionId' => 'MONO-SUB-008',
            'amount'         => 100000,
            'finalAmount'    => 79900,
        ];

        $webhook = $this->webhookWithPayload($payload);
        $event   = $this->adapter->parseWebhook($webhook);

        $this->assertInstanceOf(SubscriptionActivatedEvent::class, $event);
        $this->assertSame(79900, $event->paidAmount->minorAmount);
    }

    /** @param array<string, mixed> $payload */
    private function webhookWithPayload(array $payload): InboundWebhook
    {
        return InboundWebhook::fromRaw(
            rawBody: (string) json_encode($payload),
            headers: ['x-sign' => 'dGVzdA==', 'content-type' => 'application/json'],
            ip: '127.0.0.1',
        );
    }
}

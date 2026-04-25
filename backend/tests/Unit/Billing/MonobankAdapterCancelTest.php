<?php

declare(strict_types=1);

namespace Tests\Unit\Billing;

use App\Core\Services\Billing\Adapters\MonobankAdapter;
use App\Core\Services\Billing\Adapters\MonobankAdapterConfig;
use App\Core\Services\Billing\Commands\CancelSubscriptionCommand;
use App\Core\Services\Billing\MonobankWebhookService;
use App\Core\Services\Billing\Results\CancellationOutcome;
use App\Core\Services\Billing\Results\CancellationResult;
use App\Core\Services\Billing\ValueObjects\ProviderTokens;
use AratKruglik\Monobank\Contracts\ClientInterface as MonobankClient;
use Illuminate\Http\Client\Response;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

final class MonobankAdapterCancelTest extends TestCase
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
    public function it_returns_cancelled_result_when_delete_subscription_succeeds(): void
    {
        $httpResponse = $this->createMock(Response::class);

        $this->client
            ->expects($this->once())
            ->method('post')
            ->with('subscription/delete', ['subscriptionId' => 'MONO-SUB-001'])
            ->willReturn($httpResponse);

        $cmd    = new CancelSubscriptionCommand('ORDER-001', ProviderTokens::of('MONO-SUB-001', null));
        $result = $this->adapter->cancelSubscription($cmd);

        $this->assertInstanceOf(CancellationResult::class, $result);
        $this->assertSame(CancellationOutcome::Cancelled, $result->outcome);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_returns_already_inactive_when_provider_subscription_id_is_null(): void
    {
        $this->client->expects($this->never())->method('post');

        $cmd    = new CancelSubscriptionCommand('ORDER-002', ProviderTokens::of(null, null));
        $result = $this->adapter->cancelSubscription($cmd);

        $this->assertSame(CancellationOutcome::AlreadyInactive, $result->outcome);
        $this->assertStringContainsString('no provider subscription id', (string) $result->providerMessage);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_returns_already_inactive_when_provider_subscription_id_is_empty_string(): void
    {
        $this->client->expects($this->never())->method('post');

        $cmd    = new CancelSubscriptionCommand('ORDER-003', ProviderTokens::of('', null));
        $result = $this->adapter->cancelSubscription($cmd);

        $this->assertSame(CancellationOutcome::AlreadyInactive, $result->outcome);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_returns_failed_result_when_sdk_throws(): void
    {
        $this->client
            ->method('post')
            ->willThrowException(new \RuntimeException('Connection timeout'));

        $cmd    = new CancelSubscriptionCommand('ORDER-004', ProviderTokens::of('MONO-SUB-004', null));
        $result = $this->adapter->cancelSubscription($cmd);

        $this->assertSame(CancellationOutcome::Failed, $result->outcome);
        $this->assertSame('Connection timeout', $result->providerMessage);
    }
}

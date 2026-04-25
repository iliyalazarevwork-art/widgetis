<?php

declare(strict_types=1);

namespace Tests\Unit\Billing;

use App\Core\Services\Billing\Adapters\MonobankAdapter;
use App\Core\Services\Billing\Adapters\MonobankAdapterConfig;
use App\Core\Services\Billing\Commands\StartSubscriptionCommand;
use App\Core\Services\Billing\MonobankWebhookService;
use App\Core\Services\Billing\Results\CheckoutSession;
use App\Core\Services\Billing\ValueObjects\CallbackUrls;
use App\Core\Services\Billing\ValueObjects\Currency;
use App\Core\Services\Billing\ValueObjects\CustomerProfile;
use App\Core\Services\Billing\ValueObjects\Money;
use App\Core\Services\Billing\ValueObjects\ProductLabel;
use App\Enums\BillingPeriod;
use App\Exceptions\Billing\PaymentProviderConfigException;
use AratKruglik\Monobank\Contracts\ClientInterface as MonobankClient;
use Illuminate\Http\Client\Response;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

final class MonobankAdapterStartSubscriptionTest extends TestCase
{
    private MonobankClient&MockObject $client;

    private MonobankWebhookService&MockObject $webhookService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->client         = $this->createMock(MonobankClient::class);
        $this->webhookService = $this->createMock(MonobankWebhookService::class);
    }

    private function adapter(MonobankAdapterConfig $config): MonobankAdapter
    {
        return new MonobankAdapter($this->client, $config, $this->webhookService);
    }

    private function validConfig(): MonobankAdapterConfig
    {
        return new MonobankAdapterConfig(
            hasToken: true,
            webhookUrl: 'https://example.com/webhook/monobank',
            redirectUrl: 'https://example.com/return',
        );
    }

    private function makeCmd(?string $returnUrl = null, string $locale = 'uk'): StartSubscriptionCommand
    {
        return new StartSubscriptionCommand(
            reference: 'ORDER-MONO-001',
            firstChargeAmount: Money::fromMajor(799.0, Currency::UAH),
            recurringAmount: Money::fromMajor(799.0, Currency::UAH),
            period: BillingPeriod::Monthly,
            trialDays: 0,
            customer: CustomerProfile::of('user@test.com', '380661234567', 'Ivan', 'Petrov', $locale),
            label: ProductLabel::forSubscription('Pro', BillingPeriod::Monthly, 'activation', $locale),
            urls: new CallbackUrls(
                webhookUrl: 'https://example.com/webhook/monobank',
                returnUrl: $returnUrl ?? 'https://example.com/return',
            ),
        );
    }

    private function fakeClientResponse(string $pageUrl, string $subscriptionId): Response&MockObject
    {
        $response = $this->createMock(Response::class);
        $response->method('json')->willReturn([
            'subscriptionId' => $subscriptionId,
            'pageUrl'        => $pageUrl,
        ]);

        return $response;
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_returns_redirect_checkout_session_with_correct_url_and_provider_reference(): void
    {
        $response = $this->fakeClientResponse(
            pageUrl: 'https://pay.monobank.ua/checkout/abc123',
            subscriptionId: 'MONO-SUB-001',
        );

        $this->client
            ->expects($this->once())
            ->method('post')
            ->with('subscription/create', $this->isArray())
            ->willReturn($response);

        $session = $this->adapter($this->validConfig())->startSubscription($this->makeCmd());

        $this->assertInstanceOf(CheckoutSession::class, $session);
        $this->assertSame('GET', $session->method);
        $this->assertSame('https://pay.monobank.ua/checkout/abc123', $session->url);
        $this->assertSame('MONO-SUB-001', $session->providerReference);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_sends_monthly_interval_for_monthly_period(): void
    {
        $response = $this->fakeClientResponse('https://pay.monobank.ua/c/x', 'S1');

        $this->client
            ->expects($this->once())
            ->method('post')
            ->with(
                'subscription/create',
                $this->callback(static fn (array $p): bool => ($p['interval'] ?? '') === '1m'),
            )
            ->willReturn($response);

        $this->adapter($this->validConfig())->startSubscription($this->makeCmd());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_sends_yearly_interval_for_yearly_period(): void
    {
        $response = $this->fakeClientResponse('https://pay.monobank.ua/c/x', 'S2');

        $this->client
            ->expects($this->once())
            ->method('post')
            ->with(
                'subscription/create',
                $this->callback(static fn (array $p): bool => ($p['interval'] ?? '') === '1y'),
            )
            ->willReturn($response);

        $cmd = new StartSubscriptionCommand(
            reference: 'ORDER-YEARLY',
            firstChargeAmount: Money::fromMajor(1990.0, Currency::UAH),
            recurringAmount: Money::fromMajor(1990.0, Currency::UAH),
            period: BillingPeriod::Yearly,
            trialDays: 0,
            customer: CustomerProfile::of('user@test.com', '380661234567', 'Ivan', 'Petrov', 'uk'),
            label: ProductLabel::forSubscription('Pro', BillingPeriod::Yearly, 'activation', 'uk'),
            urls: new CallbackUrls(
                webhookUrl: 'https://example.com/webhook/monobank',
                returnUrl: 'https://example.com/return',
            ),
        );

        $this->adapter($this->validConfig())->startSubscription($cmd);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_sends_english_lang_when_customer_locale_is_en(): void
    {
        $response = $this->fakeClientResponse('https://pay.monobank.ua/c/x', 'S3');

        $this->client
            ->expects($this->once())
            ->method('post')
            ->with(
                'subscription/create',
                $this->callback(static fn (array $p): bool => ($p['lang'] ?? '') === 'en'),
            )
            ->willReturn($response);

        $this->adapter($this->validConfig())->startSubscription($this->makeCmd(locale: 'en'));
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_sends_ukrainian_lang_for_non_english_locale(): void
    {
        $response = $this->fakeClientResponse('https://pay.monobank.ua/c/x', 'S4');

        $this->client
            ->expects($this->once())
            ->method('post')
            ->with(
                'subscription/create',
                $this->callback(static fn (array $p): bool => ($p['lang'] ?? '') === 'uk'),
            )
            ->willReturn($response);

        $this->adapter($this->validConfig())->startSubscription($this->makeCmd(locale: 'uk'));
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_throws_config_exception_when_token_is_missing(): void
    {
        $this->expectException(PaymentProviderConfigException::class);

        $config = new MonobankAdapterConfig(
            hasToken: false,
            webhookUrl: 'https://example.com/webhook',
            redirectUrl: 'https://example.com/return',
        );

        $this->adapter($config)->startSubscription($this->makeCmd());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_throws_config_exception_when_webhook_url_is_empty(): void
    {
        $this->expectException(PaymentProviderConfigException::class);

        $config = new MonobankAdapterConfig(
            hasToken: true,
            webhookUrl: '',
            redirectUrl: 'https://example.com/return',
        );

        $this->adapter($config)->startSubscription($this->makeCmd());
    }
}

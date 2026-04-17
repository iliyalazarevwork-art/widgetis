<?php

declare(strict_types=1);

namespace App\Services\Billing\Adapters;

use App\Enums\BillingPeriod;
use App\Enums\PaymentProvider;
use App\Exceptions\Billing\PaymentProviderConfigException;
use App\Services\Billing\Commands\CancelSubscriptionCommand;
use App\Services\Billing\Commands\RefundCommand;
use App\Services\Billing\Commands\StartSubscriptionCommand;
use App\Services\Billing\Contracts\PaymentProviderInterfaceV2;
use App\Services\Billing\Contracts\ProviderCapabilities;
use App\Services\Billing\Contracts\SupportsRefunds;
use App\Services\Billing\Events\ChargeFailedEvent;
use App\Services\Billing\Events\IgnoredEvent;
use App\Services\Billing\Events\InvalidSignatureEvent;
use App\Services\Billing\Events\PaymentEvent;
use App\Services\Billing\Events\SubscriptionActivatedEvent;
use App\Services\Billing\Events\SubscriptionRenewedEvent;
use App\Services\Billing\MonobankWebhookService;
use App\Services\Billing\Results\CancellationResult;
use App\Services\Billing\Results\CheckoutSession;
use App\Services\Billing\Results\RefundResult;
use App\Services\Billing\ValueObjects\Currency;
use App\Services\Billing\ValueObjects\Money;
use App\Services\Billing\ValueObjects\ProviderTokens;
use App\Services\Billing\Webhooks\InboundWebhook;
use AratKruglik\Monobank\Contracts\ClientInterface as MonobankClient;
use AratKruglik\Monobank\DTO\SubscriptionRequestDTO;
use AratKruglik\Monobank\DTO\SubscriptionResponseDTO;

final class MonobankAdapter implements PaymentProviderInterfaceV2, SupportsRefunds
{
    public function __construct(
        private readonly MonobankClient $client,
        private readonly MonobankAdapterConfig $config,
        private readonly MonobankWebhookService $webhookService,
    ) {
    }

    public function name(): PaymentProvider
    {
        return PaymentProvider::Monobank;
    }

    public function capabilities(): ProviderCapabilities
    {
        return new ProviderCapabilities(
            selfManagedRecurring: true,
            supportsPartialRefund: false,
            supportsTrial: false,
            supportsInPlacePlanChange: false,
            webhookRetryWindowHours: 24,
        );
    }

    public function startSubscription(StartSubscriptionCommand $cmd): CheckoutSession
    {
        if (! $this->config->hasToken || $this->config->webhookUrl === '') {
            throw PaymentProviderConfigException::monobank();
        }

        $interval = $cmd->period === BillingPeriod::Yearly ? '1y' : '1m';
        $redirectUrl = $cmd->urls->returnUrl !== '' ? $cmd->urls->returnUrl : $this->config->redirectUrl;
        $lang = $cmd->customer->locale === 'en' ? 'en' : 'uk';

        $dto = new SubscriptionRequestDTO(
            amount: $cmd->firstChargeAmount->toMajor(),
            interval: $interval,
            webHookStatusUrl: $cmd->urls->webhookUrl,
            webHookChargeUrl: $cmd->urls->webhookUrl,
            ccy: 980,
            redirectUrl: $redirectUrl,
            validity: 86400,
        );

        $payload = array_merge($dto->toArray(), ['lang' => $lang]);

        $raw = $this->client->post('subscription/create', $payload);
        $response = SubscriptionResponseDTO::fromArray($raw->json());

        return CheckoutSession::redirect(
            url: $response->pageUrl,
            providerReference: $response->subscriptionId,
        );
    }

    public function cancelSubscription(CancelSubscriptionCommand $cmd): CancellationResult
    {
        $subId = $cmd->tokens->providerSubscriptionId;

        if ($subId === null || $subId === '') {
            return CancellationResult::alreadyInactive('no provider subscription id');
        }

        try {
            $this->client->post('subscription/delete', ['subscriptionId' => $subId]);

            return CancellationResult::cancelled();
        } catch (\Throwable $e) {
            return CancellationResult::failed($e->getMessage());
        }
    }

    public function parseWebhook(InboundWebhook $webhook): PaymentEvent
    {
        $xSign = $webhook->header('x-sign');

        if (! $this->webhookService->verifyRawSignature($webhook->rawBody, $xSign)) {
            return new InvalidSignatureEvent();
        }

        $payload = $webhook->jsonBody();

        $status = isset($payload['status']) ? (string) $payload['status'] : '';
        $invoiceId = isset($payload['invoiceId']) ? (string) $payload['invoiceId'] : '';
        $reference = isset($payload['reference']) ? (string) $payload['reference'] : '';
        $subscriptionId = isset($payload['subscriptionId']) ? (string) $payload['subscriptionId'] : null;
        $amountMinor = isset($payload['finalAmount']) ? (int) $payload['finalAmount'] : (isset($payload['amount']) ? (int) $payload['amount'] : 0);
        $now = new \DateTimeImmutable();

        $paidMoney = Money::fromMinor($amountMinor, Currency::UAH);
        $ref = $reference !== '' ? $reference : ($invoiceId !== '' ? $invoiceId : '');

        return match ($status) {
            'success' => $this->classifySuccess($ref, $invoiceId, $subscriptionId, $paidMoney, $now, $payload),
            'failure', 'reversed', 'expired' => new ChargeFailedEvent($ref, $status, $status, $now),
            default => new IgnoredEvent($ref, $status !== '' ? $status : 'unknown', $status !== '' ? $status : null),
        };
    }

    public function refund(RefundCommand $cmd): RefundResult
    {
        $amountCents = (int) round($cmd->amount->toMajor() * 100);

        $response = $this->client->post('invoice/cancel', array_filter([
            'invoiceId' => $cmd->reference,
            'amount'    => $amountCents,
        ]));

        if ($response->successful()) {
            return RefundResult::ok($cmd->reference);
        }

        return RefundResult::fail('refund_rejected', 'Monobank did not return successful response');
    }

    /**
     * Classify a `success` webhook as either an initial activation or a recurring renewal.
     *
     * Monobank sends the same `success` status for both the initial subscription creation
     * (status webhook, has a `reference` matching our order) and for recurring charges
     * (charge webhook, often no `reference`). When `reference` is present it is an
     * activation; without it (or with a subscriptionId only) it is a renewal.
     *
     * @param array<string, mixed> $payload
     */
    private function classifySuccess(
        string $ref,
        string $invoiceId,
        ?string $subscriptionId,
        Money $paidMoney,
        \DateTimeImmutable $now,
        array $payload,
    ): PaymentEvent {
        $reference = isset($payload['reference']) ? (string) $payload['reference'] : '';
        $isInitialActivation = $reference !== '';

        if ($isInitialActivation) {
            return new SubscriptionActivatedEvent(
                reference: $ref,
                tokens: ProviderTokens::of($subscriptionId, null),
                paidAmount: $paidMoney,
                paidAt: $now,
                transactionId: $invoiceId !== '' ? $invoiceId : null,
            );
        }

        return new SubscriptionRenewedEvent(
            reference: $ref,
            paidAmount: $paidMoney,
            paidAt: $now,
            transactionId: $invoiceId !== '' ? $invoiceId : $ref,
        );
    }
}

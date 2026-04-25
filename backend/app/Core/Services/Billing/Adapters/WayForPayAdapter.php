<?php

declare(strict_types=1);

namespace App\Core\Services\Billing\Adapters;

use App\Core\Services\Billing\Commands\CancelSubscriptionCommand;
use App\Core\Services\Billing\Commands\ChargeCommand;
use App\Core\Services\Billing\Commands\RefundCommand;
use App\Core\Services\Billing\Commands\StartSubscriptionCommand;
use App\Core\Services\Billing\Contracts\PaymentProviderInterface;
use App\Core\Services\Billing\Contracts\ProviderCapabilities;
use App\Core\Services\Billing\Contracts\SupportsMerchantCharge;
use App\Core\Services\Billing\Contracts\SupportsRefunds;
use App\Core\Services\Billing\Events\ChargeFailedEvent;
use App\Core\Services\Billing\Events\IgnoredEvent;
use App\Core\Services\Billing\Events\InvalidSignatureEvent;
use App\Core\Services\Billing\Events\PaymentEvent;
use App\Core\Services\Billing\Events\RefundedEvent;
use App\Core\Services\Billing\Events\SubscriptionActivatedEvent;
use App\Core\Services\Billing\Events\SubscriptionRenewedEvent;
use App\Core\Services\Billing\Results\CancellationResult;
use App\Core\Services\Billing\Results\ChargeResult;
use App\Core\Services\Billing\Results\CheckoutSession;
use App\Core\Services\Billing\Results\RefundResult;
use App\Core\Services\Billing\ValueObjects\Currency;
use App\Core\Services\Billing\ValueObjects\Money;
use App\Core\Services\Billing\ValueObjects\ProviderTokens;
use App\Core\Services\Billing\WayForPayService;
use App\Core\Services\Billing\Webhooks\InboundWebhook;
use App\Enums\PaymentProvider;
use App\Exceptions\Billing\InvalidBillingCommandException;

final class WayForPayAdapter implements
    PaymentProviderInterface,
    SupportsRefunds,
    SupportsMerchantCharge
{
    private const VERIFY_THRESHOLD_MINOR = 200;

    public function __construct(
        private readonly WayForPayService $sdk,
    ) {
    }

    public function name(): PaymentProvider
    {
        return PaymentProvider::WayForPay;
    }

    public function capabilities(): ProviderCapabilities
    {
        return new ProviderCapabilities(
            selfManagedRecurring: true,
            supportsPartialRefund: true,
            supportsTrial: true,
            supportsInPlacePlanChange: false,
            webhookRetryWindowHours: 24,
        );
    }

    public function startSubscription(StartSubscriptionCommand $cmd): CheckoutSession
    {
        $form = $this->sdk->buildVerifyCheckoutForm(
            reference: $cmd->reference,
            verifyMoney: $cmd->firstChargeAmount,
            recurringMoney: $cmd->recurringAmount,
            period: $cmd->period,
            trialDays: $cmd->trialDays,
            customer: $cmd->customer,
            label: $cmd->label,
            serviceUrl: $cmd->urls->webhookUrl,
            returnUrl: $cmd->urls->returnUrl,
        );

        return CheckoutSession::postForm(
            url: $form['url'],
            formFields: $this->flattenFormFields((array) $form['form']),
            providerReference: $cmd->reference,
        );
    }

    public function cancelSubscription(CancelSubscriptionCommand $cmd): CancellationResult
    {
        $removed = $this->sdk->removeRegularPayment($cmd->reference);

        if ($removed) {
            return CancellationResult::cancelled();
        }

        return CancellationResult::failed('regular REMOVE did not return Removed');
    }

    public function parseWebhook(InboundWebhook $webhook): PaymentEvent
    {
        $payload = $webhook->jsonBody();

        if (! $this->sdk->verifyWebhookSignature($payload)) {
            return new InvalidSignatureEvent();
        }

        $reference         = isset($payload['orderReference']) ? (string) $payload['orderReference'] : '';
        $transactionStatus = isset($payload['transactionStatus']) ? (string) $payload['transactionStatus'] : '';
        $amountMajor       = isset($payload['amount']) ? (float) $payload['amount'] : 0.0;
        $recToken          = isset($payload['recToken']) && (string) $payload['recToken'] !== '' ? (string) $payload['recToken'] : null;
        $authCode          = isset($payload['authCode']) ? (string) $payload['authCode'] : '';
        $reasonCode        = isset($payload['reasonCode']) ? (string) $payload['reasonCode'] : '';
        $reason            = isset($payload['reason']) ? (string) $payload['reason'] : '';

        $paidMoney = Money::fromMajor($amountMajor, Currency::UAH);
        $now       = new \DateTimeImmutable();

        return match ($transactionStatus) {
            'Approved'            => $this->classifyApproved($reference, $paidMoney, $recToken, $authCode, $now),
            'Refunded', 'Voided'  => new RefundedEvent($reference, $paidMoney, $now),
            'Declined', 'Expired' => new ChargeFailedEvent($reference, $reasonCode, $reason, $now),
            default               => new IgnoredEvent($reference, $transactionStatus, $transactionStatus),
        };
    }

    public function refund(RefundCommand $cmd): RefundResult
    {
        $ok = $this->sdk->refund(
            orderReference: $cmd->reference,
            amount: $cmd->amount->toMajor(),
            comment: $cmd->reason,
        );

        if ($ok) {
            return RefundResult::ok($cmd->reference);
        }

        return RefundResult::fail('refund_rejected', 'WayForPay did not return Approved');
    }

    public function chargeSavedInstrument(ChargeCommand $cmd): ChargeResult
    {
        if ($cmd->tokens->recurringToken === null || $cmd->tokens->recurringToken === '') {
            throw InvalidBillingCommandException::missingRecurringToken($cmd->reference);
        }

        $result = $this->sdk->chargeByTokenRaw(
            reference: $cmd->reference,
            amount: $cmd->amount,
            recToken: $cmd->tokens->recurringToken,
            customer: $cmd->customer,
            label: $cmd->label,
        );

        if ($result['status'] === 'Approved') {
            return ChargeResult::ok((string) ($result['transaction_id'] ?? $cmd->reference));
        }

        return ChargeResult::fail(
            (string) ($result['reason_code'] ?? 'charge_failed'),
            (string) $result['status'],
        );
    }

    /**
     * Small verify charges (≤ 2 UAH) that carry a recToken are trial
     * activations. Everything else is a recurring renewal.
     */
    private function classifyApproved(
        string $reference,
        Money $paidMoney,
        ?string $recToken,
        string $authCode,
        \DateTimeImmutable $now,
    ): PaymentEvent {
        $isVerifyCharge = $paidMoney->minorAmount <= self::VERIFY_THRESHOLD_MINOR && $recToken !== null;

        if ($isVerifyCharge) {
            return new SubscriptionActivatedEvent(
                reference: $reference,
                tokens: ProviderTokens::of($authCode !== '' ? $authCode : null, $recToken),
                paidAmount: $paidMoney,
                paidAt: $now,
                transactionId: $authCode !== '' ? $authCode : null,
            );
        }

        return new SubscriptionRenewedEvent(
            reference: $reference,
            paidAmount: $paidMoney,
            paidAt: $now,
            transactionId: $authCode !== '' ? $authCode : $reference,
        );
    }

    /**
     * Flatten WayForPay's hosted-checkout form into a string-keyed map.
     * Arrays (productName[], productCount[], productPrice[]) are expanded
     * into bracketed keys so the browser's form-encoder preserves order.
     *
     * @param array<string, mixed> $form
     *
     * @return array<string, string>
     */
    private function flattenFormFields(array $form): array
    {
        $flat = [];

        foreach ($form as $key => $value) {
            if (is_array($value)) {
                foreach (array_values($value) as $index => $item) {
                    $flat[$key . '[' . $index . ']'] = (string) $item;
                }

                continue;
            }

            $flat[$key] = (string) $value;
        }

        return $flat;
    }
}

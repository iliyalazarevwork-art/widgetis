<?php

declare(strict_types=1);

namespace Tests\Unit\Billing;

use App\Enums\BillingPeriod;
use App\Exceptions\Billing\InvalidBillingCommandException;
use App\Services\Billing\Adapters\WayForPayAdapter;
use App\Services\Billing\Commands\CancelSubscriptionCommand;
use App\Services\Billing\Commands\ChargeCommand;
use App\Services\Billing\Commands\RefundCommand;
use App\Services\Billing\Results\CancellationOutcome;
use App\Services\Billing\Results\CancellationResult;
use App\Services\Billing\Results\ChargeResult;
use App\Services\Billing\Results\RefundResult;
use App\Services\Billing\ValueObjects\Currency;
use App\Services\Billing\ValueObjects\CustomerProfile;
use App\Services\Billing\ValueObjects\Money;
use App\Services\Billing\ValueObjects\ProductLabel;
use App\Services\Billing\ValueObjects\ProviderTokens;
use App\Services\Billing\WayForPayService;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

final class WayForPayAdapterCancelRefundChargeTest extends TestCase
{
    private WayForPayService&MockObject $sdk;

    private WayForPayAdapter $adapter;

    protected function setUp(): void
    {
        parent::setUp();

        $this->sdk     = $this->createMock(WayForPayService::class);
        $this->adapter = new WayForPayAdapter($this->sdk);
    }

    // ─── cancelSubscription ────────────────────────────────────────────

    /** @test */
    public function it_returns_cancelled_result_when_remove_regular_payment_succeeds(): void
    {
        $this->sdk->method('removeRegularPayment')->with('ORDER-001')->willReturn(true);

        $cmd    = new CancelSubscriptionCommand('ORDER-001', ProviderTokens::empty());
        $result = $this->adapter->cancelSubscription($cmd);

        $this->assertInstanceOf(CancellationResult::class, $result);
        $this->assertSame(CancellationOutcome::Cancelled, $result->outcome);
    }

    /** @test */
    public function it_returns_failed_result_when_remove_regular_payment_returns_false(): void
    {
        $this->sdk->method('removeRegularPayment')->willReturn(false);

        $cmd    = new CancelSubscriptionCommand('ORDER-002', ProviderTokens::empty());
        $result = $this->adapter->cancelSubscription($cmd);

        $this->assertSame(CancellationOutcome::Failed, $result->outcome);
        $this->assertStringContainsString('REMOVE', (string) $result->providerMessage);
    }

    // ─── refund ────────────────────────────────────────────────────────

    /** @test */
    public function it_returns_ok_refund_result_when_sdk_refund_succeeds(): void
    {
        $this->sdk->method('refund')
            ->with('ORDER-003', 1.0, 'test refund reason')
            ->willReturn(true);

        $cmd    = new RefundCommand('ORDER-003', Money::fromMajor(1.0, Currency::UAH), 'test refund reason');
        $result = $this->adapter->refund($cmd);

        $this->assertInstanceOf(RefundResult::class, $result);
        $this->assertTrue($result->success);
        $this->assertSame('ORDER-003', $result->refundId);
    }

    /** @test */
    public function it_returns_failed_refund_result_when_sdk_refund_returns_false(): void
    {
        $this->sdk->method('refund')->willReturn(false);

        $cmd    = new RefundCommand('ORDER-004', Money::fromMajor(1.0, Currency::UAH), 'cancel reason');
        $result = $this->adapter->refund($cmd);

        $this->assertFalse($result->success);
        $this->assertSame('refund_rejected', $result->failureCode);
    }

    // ─── chargeSavedInstrument ─────────────────────────────────────────

    /** @test */
    public function it_returns_ok_charge_result_when_sdk_charge_is_approved(): void
    {
        $this->sdk->method('chargeByTokenRaw')->willReturn([
            'status'         => 'Approved',
            'transaction_id' => 'TXN-123',
            'reason_code'    => '1100',
            'raw'            => [],
        ]);

        $cmd    = $this->chargeCommand('ORDER-005', 'REC-TOKEN');
        $result = $this->adapter->chargeSavedInstrument($cmd);

        $this->assertInstanceOf(ChargeResult::class, $result);
        $this->assertTrue($result->success);
        $this->assertSame('TXN-123', $result->transactionId);
    }

    /** @test */
    public function it_returns_failed_charge_result_when_sdk_charge_is_declined(): void
    {
        $this->sdk->method('chargeByTokenRaw')->willReturn([
            'status'         => 'Declined',
            'transaction_id' => null,
            'reason_code'    => '1019',
            'raw'            => [],
        ]);

        $cmd    = $this->chargeCommand('ORDER-006', 'REC-TOKEN');
        $result = $this->adapter->chargeSavedInstrument($cmd);

        $this->assertFalse($result->success);
        $this->assertSame('1019', $result->failureCode);
        $this->assertSame('Declined', $result->failureMessage);
    }

    /** @test */
    public function it_throws_when_recurring_token_is_missing(): void
    {
        $this->expectException(InvalidBillingCommandException::class);
        $this->expectExceptionMessage('ORDER-007');

        $cmd = new ChargeCommand(
            reference: 'ORDER-007',
            amount: Money::fromMajor(799.0, Currency::UAH),
            tokens: ProviderTokens::of('prov-id', null),
            customer: CustomerProfile::of('test@example.com', '', 'Test', 'User', 'en'),
            label: ProductLabel::forSubscription('Pro', BillingPeriod::Monthly, 'renewal', 'en'),
        );

        $this->adapter->chargeSavedInstrument($cmd);
    }

    /** @test */
    public function it_falls_back_to_reference_as_transaction_id_when_sdk_returns_null(): void
    {
        $this->sdk->method('chargeByTokenRaw')->willReturn([
            'status'         => 'Approved',
            'transaction_id' => null,
            'reason_code'    => null,
            'raw'            => [],
        ]);

        $cmd    = $this->chargeCommand('ORDER-008', 'REC-TOKEN');
        $result = $this->adapter->chargeSavedInstrument($cmd);

        $this->assertTrue($result->success);
        $this->assertSame('ORDER-008', $result->transactionId);
    }

    private function chargeCommand(string $reference, string $recToken): ChargeCommand
    {
        return new ChargeCommand(
            reference: $reference,
            amount: Money::fromMajor(799.0, Currency::UAH),
            tokens: ProviderTokens::of(null, $recToken),
            customer: CustomerProfile::of('test@example.com', '380661234567', 'Ivan', 'Petrov', 'uk'),
            label: ProductLabel::forSubscription('Pro', BillingPeriod::Monthly, 'renewal', 'uk'),
        );
    }
}

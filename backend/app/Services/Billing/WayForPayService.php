<?php

declare(strict_types=1);

namespace App\Services\Billing;

use App\Enums\BillingPeriod;
use App\Models\Order;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use WayForPay\SDK\Collection\ProductCollection;
use WayForPay\SDK\Credential\AccountSecretCredential;
use WayForPay\SDK\Domain\CardToken;
use WayForPay\SDK\Domain\Client as WayForPayClient;
use WayForPay\SDK\Domain\Product;
use WayForPay\SDK\Domain\Regular;
use WayForPay\SDK\Exception\SignatureException;
use WayForPay\SDK\Exception\WayForPaySDKException;
use WayForPay\SDK\Handler\ServiceUrlHandler;
use WayForPay\SDK\Helper\SignatureHelper;
use WayForPay\SDK\Request\ApiRequest;
use WayForPay\SDK\Wizard\ChargeWizard;
use WayForPay\SDK\Wizard\PurchaseWizard;
use WayForPay\SDK\Wizard\RefundWizard;

/**
 * Thin facade over the official wayforpay/php-sdk wizards.
 *
 * Keeps the public API stable (createVerifyCheckout, chargeByToken, refund,
 * verifyWebhookSignature, buildWebhookResponse, signPurchase, signRefund)
 * so WayForPayProvider / WayForPayWebhookService / the test suite keep
 * working after the rewrite.
 *
 * Why a facade on top of the SDK instead of calling it directly from the
 * provider: the SDK exposes a lot of moving parts (Wizards, Requests,
 * Responses, Credentials, Transformers) and mixes prod and test credential
 * helpers in the same namespace. Keeping one small Laravel-native layer
 * means the rest of the app only sees Laravel types and simple arrays,
 * and the SDK surface can be swapped for another vendor in the future
 * without touching the provider / webhook / subscription services.
 */
class WayForPayService
{
    public const HOSTED_CHECKOUT_URL = 'https://secure.wayforpay.com/pay';

    private AccountSecretCredential $credential;

    private string $merchantDomainName;

    public function __construct(
        private readonly LaravelHttpWayForPayTransformer $transformer,
    ) {
        $this->credential = new AccountSecretCredential(
            (string) config('services.wayforpay.merchant_account'),
            (string) config('services.wayforpay.secret_key'),
        );

        $this->merchantDomainName = (string) config('services.wayforpay.merchant_domain_name');
    }

    /**
     * Build a hosted-checkout form for card-on-file tokenisation.
     *
     * The browser POSTs the returned fields to HOSTED_CHECKOUT_URL; on
     * success WayForPay hits our serviceUrl with a recToken the subscription
     * remembers and later uses for merchant-initiated CHARGE calls.
     *
     * @return array{url: string, form: array<string, mixed>}
     */
    public function createVerifyCheckout(
        User $user,
        Order $order,
        Plan $plan,
        BillingPeriod $billingPeriod,
        string $serviceUrl,
        string $returnUrl,
        float $verifyAmount,
    ): array {
        $amount = $verifyAmount > 0 ? $verifyAmount : 1.0;
        $productName = $this->productLabel($plan, $billingPeriod, 'активація картки');

        // WayForPay-managed recurring: the bank itself schedules renewal
        // charges and fires a webhook for every one of them — we treat each
        // webhook as ground truth and never run our own "charge" cron for
        // this provider. First recurring charge lands on the day the trial
        // ends; subsequent charges follow the monthly/yearly cadence.
        $regularAmount = $billingPeriod === BillingPeriod::Yearly
            ? (float) $plan->price_yearly
            : (float) $plan->price_monthly;

        $trialDays   = max(0, (int) ($plan->trial_days ?? 7));
        $firstCharge = (new \DateTime())->modify('+' . $trialDays . ' days');
        $regularMode = $billingPeriod === BillingPeriod::Yearly
            ? Regular::MODE_YEARLY
            : Regular::MODE_MONTHLY;

        $regular = new Regular(
            modes: [$regularMode],
            amount: $regularAmount,
            dateNext: $firstCharge,
            dateEnd: null,
            count: null,
            on: true,
            behavior: Regular::BEHAVIOR_DEFAULT,
        );

        $form = PurchaseWizard::get($this->credential)
            ->setOrderReference($order->order_number)
            ->setAmount($amount)
            ->setCurrency('UAH')
            ->setOrderDate($this->orderDate($order))
            ->setMerchantDomainName($this->merchantDomainName)
            ->setClient($this->buildClient($user))
            ->setProducts(new ProductCollection([
                new Product($productName, $amount, 1),
            ]))
            ->setRegular($regular)
            ->setServiceUrl($serviceUrl)
            ->setReturnUrl($returnUrl)
            ->setLanguage('UA')
            ->getForm();

        // PurchaseForm::getData() includes a lot of optional empty fields
        // (delivery, avia, alternativeAmount, ...) that we strip before
        // sending to the browser so the form only carries real values.
        /** @var array<string, mixed> $data */
        $data = array_filter(
            $form->getData(),
            static fn ($value): bool => $value !== null && $value !== '' && $value !== 0 && $value !== 0.0 && $value !== [],
        );

        return [
            'url'  => self::HOSTED_CHECKOUT_URL,
            'form' => $data,
        ];
    }

    /**
     * Merchant-initiated charge against a previously saved recToken.
     *
     * Used by ChargeRecurringSubscriptions. Returns a normalised array
     * that WayForPayProvider::chargeRecurring maps to ChargeResult — same
     * shape as the hand-rolled implementation so its callers don't
     * need to change.
     *
     * @return array{status: string, transaction_id: ?string, reason_code: ?string, raw: array<string, mixed>}
     */
    public function chargeByToken(
        Order $order,
        Plan $plan,
        BillingPeriod $billingPeriod,
        string $recToken,
        float $amount,
        string $clientEmail,
    ): array {
        $productName = $this->productLabel($plan, $billingPeriod, 'поновлення');

        $request = ChargeWizard::get($this->credential)
            ->setOrderReference($order->order_number)
            ->setAmount($amount)
            ->setCurrency('UAH')
            ->setOrderDate($this->orderDate($order))
            ->setMerchantDomainName($this->merchantDomainName)
            ->setClient(new WayForPayClient(
                'Widgetis',
                'Subscriber',
                $clientEmail,
                '380000000000',
                'UA',
            ))
            ->setProducts(new ProductCollection([
                new Product($productName, $amount, 1),
            ]))
            ->setCardToken(new CardToken($recToken))
            ->getRequest();

        $this->useLaravelTransport($request);

        try {
            $response = $request->send();
        } catch (WayForPaySDKException $e) {
            Log::channel('payments')->warning('wayforpay.charge.sdk_error', [
                'order_reference' => $order->order_number,
                'error' => $e->getMessage(),
            ]);

            return [
                'status'         => 'Error',
                'transaction_id' => null,
                'reason_code'    => null,
                'raw'            => ['error' => $e->getMessage()],
            ];
        }

        // ChargeResponse exposes the parsed Transaction but doesn't keep
        // the raw array — we flatten the fields we care about back into a
        // small struct for callers that want to log the outcome.
        $transaction = $response->getTransaction();
        $status = (string) $transaction->getStatus();
        $reasonCode = (string) $response->getReason()->getCode();
        $orderReference = (string) $transaction->getOrderReference();

        Log::channel('payments')->info('wayforpay.charge.response', [
            'order_reference' => $order->order_number,
            'transaction_status' => $status,
            'reason_code' => $reasonCode,
        ]);

        return [
            'status'         => $status,
            'transaction_id' => $orderReference !== '' ? $orderReference : null,
            'reason_code'    => $reasonCode !== '' ? $reasonCode : null,
            'raw'            => [
                'transactionStatus' => $status,
                'reasonCode'        => $reasonCode,
                'orderReference'    => $orderReference,
            ],
        ];
    }

    /**
     * Best-effort refund of the 1 UAH trial verification charge so the
     * customer's statement reflects zero cost for the trial activation.
     * Returns true only when WayForPay reported 'Approved' — anything
     * else is logged and treated as an operator-reconcile case.
     */
    public function refund(string $orderReference, float $amount, string $comment = ''): bool
    {
        $request = RefundWizard::get($this->credential)
            ->setOrderReference($orderReference)
            ->setAmount($amount)
            ->setCurrency('UAH')
            ->setComment($comment !== '' ? $comment : 'Widgetis trial activation auto-refund')
            ->getRequest();

        $this->useLaravelTransport($request);

        try {
            $response = $request->send();
        } catch (SignatureException $e) {
            // Response was delivered but its signature didn't verify. For
            // a refund specifically we log and move on: the money either
            // moved or it didn't, and we never advance subscription state
            // based on this response anyway.
            Log::channel('payments')->warning('wayforpay.refund.signature_mismatch', [
                'order_reference' => $orderReference,
                'error' => $e->getMessage(),
            ]);

            return false;
        } catch (WayForPaySDKException $e) {
            Log::channel('payments')->warning('wayforpay.refund.sdk_error', [
                'order_reference' => $orderReference,
                'error' => $e->getMessage(),
            ]);

            return false;
        }

        $status = (string) $response->getTransactionStatus();

        if ($status !== 'Approved') {
            Log::channel('payments')->warning('wayforpay.refund.non_approved', [
                'order_reference' => $orderReference,
                'status' => $status,
            ]);

            return false;
        }

        return true;
    }

    /**
     * Stop WayForPay's bank-side recurring scheduler for a given order.
     *
     * WayForPay manages its own charge schedule when a PurchaseWizard is
     * submitted with setRegular(). Cancelling our Subscription row stops our
     * own cron from acting, but WayForPay would continue billing the customer
     * on its own cadence unless we explicitly remove the regular payment via
     * the regularApi endpoint.
     *
     * Returns true on a confirmed REMOVE response, false on any failure (HTTP
     * error, non-200 status, or missing transactionStatus). Failures are
     * non-fatal — the caller logs and continues so the subscription row is
     * still marked cancelled even if the API call fails.
     */
    public function removeRegularPayment(string $orderReference): bool
    {
        $merchantAccount = (string) config('services.wayforpay.merchant_account');
        $secretKey       = (string) config('services.wayforpay.secret_key');

        /** @var string $signature */
        $signature = SignatureHelper::calculateSignature(
            [$merchantAccount, $orderReference],
            $secretKey,
        );

        try {
            $response = Http::timeout(15)
                ->post('https://api.wayforpay.com/regularApi', [
                    'transactionType'    => 'REMOVE',
                    'merchantAccount'    => $merchantAccount,
                    'orderReference'     => $orderReference,
                    'merchantSignature'  => $signature,
                ]);

            if (! $response->successful()) {
                Log::channel('payments')->warning('wayforpay.regular.remove_http_error', [
                    'order_reference' => $orderReference,
                    'http_status'     => $response->status(),
                ]);

                return false;
            }

            /** @var array<string, mixed> $body */
            $body   = (array) $response->json();
            $status = (string) ($body['transactionStatus'] ?? '');

            Log::channel('payments')->info('wayforpay.regular.removed', [
                'order_reference'    => $orderReference,
                'transaction_status' => $status,
            ]);

            return $status === 'Removed';
        } catch (\Throwable $e) {
            Log::channel('payments')->warning('wayforpay.regular.remove_exception', [
                'order_reference' => $orderReference,
                'error'           => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Verify the signature on a serviceUrl webhook body. Delegates to the
     * SDK's ServiceUrlHandler so field layout stays in sync with any future
     * SDK upgrade.
     *
     * @param array<string, mixed> $payload
     */
    public function verifyWebhookSignature(array $payload): bool
    {
        if (! isset($payload['merchantSignature']) || $payload['merchantSignature'] === '') {
            return false;
        }

        try {
            (new ServiceUrlHandler($this->credential))->parseRequestFromArray($payload);
        } catch (WayForPaySDKException) {
            return false;
        }

        return true;
    }

    /**
     * Build the signed JSON-ready body WayForPay expects as a webhook ACK.
     * Without a valid ACK WayForPay treats the delivery as failed and
     * retries for up to 24h, amplifying any processing side effects.
     *
     * @return array{orderReference: string, status: string, time: int, signature: string}
     */
    public function buildWebhookResponse(string $orderReference, string $status = 'accept'): array
    {
        $time = time();

        /** @var string $signature */
        $signature = SignatureHelper::calculateSignature(
            [$orderReference, $status, $time],
            (string) $this->credential->getSecret(),
        );

        return [
            'orderReference' => $orderReference,
            'status'         => $status,
            'time'           => $time,
            'signature'      => $signature,
        ];
    }

    /**
     * Build a fully-signed fake Approved webhook payload for local
     * emulation (WayForPayWebhookService::simulateSuccess uses this).
     *
     * @return array<string, mixed>
     */
    public function buildFakeWebhookPayload(Order $order, float $amount, string $transactionStatus = 'Approved'): array
    {
        $fields = [
            'merchantAccount'    => $this->credential->getAccount(),
            'orderReference'     => $order->order_number,
            'amount'             => $this->formatAmount($amount),
            'currency'           => 'UAH',
            'authCode'           => 'EMUL' . substr(md5($order->order_number), 0, 6),
            'email'              => (string) ($order->user->email ?? ''),
            'phone'              => (string) ($order->user->phone ?? ''),
            'createdDate'        => time(),
            'processingDate'     => time(),
            'cardPan'            => '41****1111',
            'cardType'           => 'Visa',
            'issuerBankCountry'  => 'Ukraine',
            'issuerBankName'     => 'Emulated Bank',
            'recToken'           => 'EMUL-REC-' . strtoupper(substr(md5($order->order_number), 0, 16)),
            'transactionStatus'  => $transactionStatus,
            'reason'             => 'Ok',
            'reasonCode'         => '1100',
            'fee'                => 0,
            'paymentSystem'      => 'card',
        ];

        /** @var string $signature */
        $signature = SignatureHelper::calculateSignature(
            [
                $fields['merchantAccount'],
                $fields['orderReference'],
                $fields['amount'],
                $fields['currency'],
                $fields['authCode'],
                $fields['cardPan'],
                $fields['transactionStatus'],
                $fields['reasonCode'],
            ],
            (string) $this->credential->getSecret(),
        );

        $fields['merchantSignature'] = $signature;

        return $fields;
    }

    /**
     * Sign a Purchase/CHARGE request payload. Kept public because unit
     * tests pin the exact field order for future-proofing against a
     * silent change in the SDK's signature helper.
     *
     * @param array<string, mixed> $payload
     */
    public function signPurchase(array $payload): string
    {
        /** @var list<string> $productNames */
        $productNames  = array_values(array_map('strval', (array) ($payload['productName']  ?? [])));
        /** @var list<string> $productCounts */
        $productCounts = array_values(array_map('strval', (array) ($payload['productCount'] ?? [])));
        /** @var list<string> $productPrices */
        $productPrices = array_values(array_map('strval', (array) ($payload['productPrice'] ?? [])));

        /** @var string $signature */
        $signature = SignatureHelper::calculateSignature(
            [
                (string) ($payload['merchantAccount']    ?? ''),
                (string) ($payload['merchantDomainName'] ?? ''),
                (string) ($payload['orderReference']     ?? ''),
                (string) ($payload['orderDate']          ?? ''),
                (string) ($payload['amount']             ?? ''),
                (string) ($payload['currency']           ?? ''),
                $productNames,
                $productCounts,
                $productPrices,
            ],
            (string) $this->credential->getSecret(),
        );

        return $signature;
    }

    /**
     * Sign a REFUND request payload.
     *
     * @param array<string, mixed> $payload
     */
    public function signRefund(array $payload): string
    {
        /** @var string $signature */
        $signature = SignatureHelper::calculateSignature(
            [
                (string) ($payload['merchantAccount'] ?? ''),
                (string) ($payload['orderReference']  ?? ''),
                (string) ($payload['amount']          ?? ''),
                (string) ($payload['currency']        ?? ''),
            ],
            (string) $this->credential->getSecret(),
        );

        return $signature;
    }

    /**
     * Ensure the SDK API request goes through our Laravel Http transport
     * so Http::fake() stubs apply and the call picks up Laravel-level
     * retries / timeouts / logging.
     */
    private function useLaravelTransport(ApiRequest $request): void
    {
        $request->setTransformer($this->transformer);
    }

    private function orderDate(Order $order): \DateTime
    {
        $timestamp = $order->created_at?->timestamp ?: time();

        return (new \DateTime())->setTimestamp($timestamp);
    }

    private function buildClient(User $user): WayForPayClient
    {
        $name = trim((string) ($user->name ?? ''));
        $parts = $name !== '' ? preg_split('/\s+/u', $name) : [];
        $parts = is_array($parts) ? $parts : [];

        $firstName = $parts[0] ?? 'Widgetis';
        $lastName  = count($parts) > 1 ? $parts[count($parts) - 1] : 'Subscriber';

        $phone = $this->normalisePhone((string) ($user->phone ?? ''));

        return new WayForPayClient(
            $firstName,
            $lastName,
            (string) $user->email,
            $phone,
            'UA',
        );
    }

    private function productLabel(Plan $plan, BillingPeriod $billingPeriod, string $suffix): string
    {
        $planName    = (string) $plan->getTranslation('name', 'uk');
        $periodLabel = $billingPeriod === BillingPeriod::Yearly ? 'річна підписка' : 'щомісячна підписка';

        return 'Widgetis: ' . $planName . ' — ' . $periodLabel . ' (' . $suffix . ')';
    }

    private function normalisePhone(string $phone): string
    {
        if ($phone === '') {
            return '380000000000';
        }

        $digits = preg_replace('/[^\d]/', '', $phone) ?? '';

        return $digits !== '' ? $digits : '380000000000';
    }

    private function formatAmount(float $amount): string
    {
        return number_format($amount, 2, '.', '');
    }
}

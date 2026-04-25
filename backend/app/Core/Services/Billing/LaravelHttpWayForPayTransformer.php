<?php

declare(strict_types=1);

namespace App\Core\Services\Billing;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use WayForPay\SDK\Contract\RequestInterface;
use WayForPay\SDK\Contract\RequestTransformerInterface;
use WayForPay\SDK\Contract\ResponseInterface;
use WayForPay\SDK\Domain\Reason;
use WayForPay\SDK\Exception\ApiException;

/**
 * Drop-in replacement for WayForPay SDK's CurlRequestTransformer that
 * routes every outbound API call through Laravel's Http facade instead
 * of anlutro/cURL directly.
 *
 * Why replace it:
 *   1. Http::fake() works transparently in tests — no need to monkey-patch
 *      the SDK with injected mocks or test-only subclasses.
 *   2. Retries, timeouts, middleware, and JSON logging are all centralised
 *      on the Laravel Http layer where the rest of the app also lives.
 *   3. The SDK's bundled cURL transport has no timeout and no logging, so
 *      a network stall on WayForPay's side would hang the worker forever.
 *
 * Behaviour is identical to CurlRequestTransformer: POST JSON to the
 * Request's endpoint with its filtered transaction data, decode the JSON
 * body, and hand it to Request::getResponse() so the SDK can build the
 * typed response object and verify its signature.
 */
class LaravelHttpWayForPayTransformer implements RequestTransformerInterface
{
    /**
     * Hard cap per API call. WayForPay's own docs suggest responses come
     * back within 3s; we allow 15s before treating the call as a failure.
     */
    private const TIMEOUT_SECONDS = 15;

    public function transform(RequestInterface $transactionRequest): ResponseInterface
    {
        $endpoint = $transactionRequest->getEndpoint();
        $payload  = array_filter($transactionRequest->getTransactionData());

        try {
            $response = Http::timeout(self::TIMEOUT_SECONDS)
                ->acceptJson()
                ->asJson()
                ->post($endpoint->getUrl(), $payload);
        } catch (\Throwable $e) {
            Log::channel('payments')->error('wayforpay.http.transport_failure', [
                'endpoint' => $endpoint->getUrl(),
                'error'    => $e->getMessage(),
            ]);

            // Re-throw as ApiException so upstream catch blocks in the
            // provider uniformly handle transport + business errors.
            throw new ApiException(new Reason(-1, $e->getMessage()));
        }

        /** @var array<string, mixed> $body */
        $body = (array) ($response->json() ?? []);

        return $transactionRequest->getResponse($body);
    }
}

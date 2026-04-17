<?php

declare(strict_types=1);

namespace App\Services\Billing;

use AratKruglik\Monobank\Services\PubKeyProvider;

/**
 * Monobank webhook signature-verification helper.
 *
 * Provides only the cryptographic verification primitive consumed by
 * MonobankAdapter::parseWebhook(). All state-mutation logic (subscription
 * activation, payment creation) has been moved to WebhookDispatcher.
 */
class MonobankWebhookService
{
    public function __construct(
        private readonly PubKeyProvider $pubKeyProvider,
    ) {
    }

    /**
     * Verify a Monobank webhook signature given the raw body and X-Sign header value.
     */
    public function verifyRawSignature(string $rawBody, ?string $xSign): bool
    {
        if (! is_string($xSign) || $xSign === '') {
            return false;
        }

        $signature = base64_decode($xSign, true);

        if ($signature === false) {
            return false;
        }

        try {
            $pubKey = $this->pubKeyProvider->getKey();
        } catch (\Throwable) {
            return false;
        }

        $pemKey = base64_decode($pubKey, strict: true);

        if ($pemKey === false) {
            return false;
        }

        try {
            $result = openssl_verify($rawBody, $signature, $pemKey, OPENSSL_ALGO_SHA256);
        } catch (\Throwable) {
            return false;
        }

        return $result === 1;
    }
}

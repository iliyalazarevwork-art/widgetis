<?php

declare(strict_types=1);

namespace App\Core\Services\Billing\ValueObjects;

use App\Exceptions\Billing\InvalidCallbackUrlException;

final readonly class CallbackUrls
{
    public function __construct(
        public string $webhookUrl,
        public string $returnUrl,
        public ?string $cancelUrl = null,
    ) {
        $this->assertValidUrl($webhookUrl);
        $this->assertValidUrl($returnUrl);

        if ($cancelUrl !== null) {
            $this->assertValidUrl($cancelUrl);
        }
    }

    private function assertValidUrl(string $url): void
    {
        if (! str_starts_with($url, 'http://') && ! str_starts_with($url, 'https://')) {
            throw InvalidCallbackUrlException::notHttps($url);
        }
    }
}

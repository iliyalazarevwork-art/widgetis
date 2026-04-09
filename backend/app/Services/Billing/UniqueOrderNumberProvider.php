<?php

declare(strict_types=1);

namespace App\Services\Billing;

use App\Models\Order;
use RuntimeException;

class UniqueOrderNumberProvider
{
    private const int MAX_ATTEMPTS = 15;

    public function __construct(
        private readonly OrderNumberGenerator $generator,
    ) {
    }

    /**
     * @throws RuntimeException
     */
    public function get(?string $site, string $planSlug): string
    {
        for ($i = 0; $i < self::MAX_ATTEMPTS; $i++) {
            $number = $this->generator->generate($site, $planSlug);

            if (! Order::where('order_number', $number)->exists()) {
                return $number;
            }
        }

        throw new RuntimeException('Failed to generate unique order number after '.self::MAX_ATTEMPTS.' attempts');
    }
}

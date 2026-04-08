<?php

declare(strict_types=1);

namespace App\Enums;

enum Platform: string
{
    case Horoshop = 'horoshop';
    case Shopify = 'shopify';
    case WooCommerce = 'woocommerce';
    case OpenCart = 'opencart';
    case WordPress = 'wordpress';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::Horoshop => 'Horoshop',
            self::Shopify => 'Shopify',
            self::WooCommerce => 'WooCommerce',
            self::OpenCart => 'OpenCart',
            self::WordPress => 'WordPress',
            self::Other => 'Other',
        };
    }

    public function isSupported(): bool
    {
        return match ($this) {
            self::Horoshop => true,
            default => false,
        };
    }

    /**
     * @return list<array{value: string, label: string, supported: bool}>
     */
    public static function toArray(): array
    {
        return array_map(
            fn (self $p) => [
                'value' => $p->value,
                'label' => $p->label(),
                'supported' => $p->isSupported(),
            ],
            self::cases(),
        );
    }
}

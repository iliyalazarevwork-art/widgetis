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
}

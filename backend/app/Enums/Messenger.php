<?php

declare(strict_types=1);

namespace App\Enums;

enum Messenger: string
{
    case Telegram = 'telegram';
    case Viber = 'viber';
    case WhatsApp = 'whatsapp';

    public function label(): string
    {
        return match ($this) {
            self::Telegram => 'Telegram',
            self::Viber => 'Viber',
            self::WhatsApp => 'WhatsApp',
        };
    }
}

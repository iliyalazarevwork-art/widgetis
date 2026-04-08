<?php

declare(strict_types=1);

namespace App\Enums;

enum ManagerRequestType: string
{
    case InstallHelp = 'install_help';
    case General = 'general';
    case DemoRequest = 'demo_request';

    public function label(): string
    {
        return match ($this) {
            self::InstallHelp => 'Installation Help',
            self::General => 'General',
            self::DemoRequest => 'Demo Request',
        };
    }
}

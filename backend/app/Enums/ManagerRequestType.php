<?php

declare(strict_types=1);

namespace App\Enums;

enum ManagerRequestType: string
{
    case InstallHelp = 'install_help';
    case General = 'general';
    case DemoRequest = 'demo_request';
    case PlanInterest = 'plan_interest';

    public function label(): string
    {
        return match ($this) {
            self::InstallHelp => 'Installation Help',
            self::General => 'General',
            self::DemoRequest => 'Demo Request',
            self::PlanInterest => 'Plan Interest Lead',
        };
    }
}

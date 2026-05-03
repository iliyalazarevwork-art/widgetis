<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Enums;

enum DemoEntrySource: string
{
    case Public = 'public';
    case Admin = 'admin';
}

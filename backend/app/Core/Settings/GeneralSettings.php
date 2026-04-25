<?php

declare(strict_types=1);

namespace App\Core\Settings;

use Spatie\LaravelSettings\Settings;

class GeneralSettings extends Settings
{
    public string $phone;
    public string $email;
    public string $business_hours;
    /** @var array<string, string> */
    public array $socials;
    /** @var array<string, string> */
    public array $messengers;
    /** @var array<string, int> */
    public array $stats;

    public static function group(): string
    {
        return 'general';
    }
}

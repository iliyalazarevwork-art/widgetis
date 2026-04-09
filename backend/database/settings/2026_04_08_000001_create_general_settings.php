<?php

declare(strict_types=1);

use Spatie\LaravelSettings\Migrations\SettingsMigration;

class CreateGeneralSettings extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('general.phone', '+380 96 149 47 47');
        $this->migrator->add('general.email', 'hello@widgetis.com');
        $this->migrator->add('general.business_hours', 'Mon-Fri 9:00-20:00');
        $this->migrator->add('general.socials', [
            'instagram' => 'https://instagram.com/widgetis',
            'telegram' => 'https://t.me/widgetis',
            'facebook' => '',
        ]);
        $this->migrator->add('general.messengers', [
            'telegram' => 'https://t.me/widgetis_support',
            'viber' => 'viber://chat?number=%2B380961494747',
            'whatsapp' => 'https://wa.me/380961494747',
        ]);
        $this->migrator->add('general.stats', [
            'stores_count' => 120,
            'widgets_deployed' => 530,
        ]);
    }
}

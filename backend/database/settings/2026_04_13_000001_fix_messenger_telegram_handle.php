<?php

declare(strict_types=1);

use Spatie\LaravelSettings\Migrations\SettingsMigration;

class FixMessengerTelegramHandle extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->update('general.messengers', fn () => [
            'telegram' => 'https://t.me/widgetis',
            'viber' => 'viber://chat?number=%2B380961494747',
            'whatsapp' => 'https://wa.me/380961494747',
        ]);
    }
}

<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Admin panel domain
    |--------------------------------------------------------------------------
    |
    | When set, the Filament panel binds to this hostname and serves at the
    | URL root (https://manage.widgetis.com/). When null (local dev), the
    | panel is served at /manage on the API origin instead. Read by
    | App\Providers\Filament\AdminPanelProvider.
    */
    'domain' => env('FILAMENT_DOMAIN'),
];

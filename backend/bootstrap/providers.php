<?php

declare(strict_types=1);

return [
    App\Providers\AppServiceProvider::class,
    App\Providers\EventServiceProvider::class,
    App\Providers\PaymentProviderServiceProvider::class,
    App\Providers\PgvectorServiceProvider::class,
    App\SmartSearch\Providers\SmartSearchServiceProvider::class,
];

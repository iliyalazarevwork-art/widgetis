<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Filament\Clusters;

use BackedEnum;
use Filament\Clusters\Cluster;

final class Runtime extends Cluster
{
    protected static string|BackedEnum|null $navigationIcon = 'heroicon-o-cube-transparent';

    protected static ?string $clusterBreadcrumb = 'Віджети клієнтів';

    protected static ?int $navigationSort = 2;

    public static function getNavigationLabel(): string
    {
        return 'Віджети клієнтів';
    }
}

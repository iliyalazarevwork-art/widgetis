<?php

declare(strict_types=1);

namespace App\Core\Filament\Clusters;

use BackedEnum;
use Filament\Clusters\Cluster;

final class Business extends Cluster
{
    protected static string|BackedEnum|null $navigationIcon = 'heroicon-o-briefcase';

    protected static ?string $clusterBreadcrumb = 'Бізнес';

    protected static ?int $navigationSort = 1;

    public static function getNavigationLabel(): string
    {
        return 'Бізнес';
    }
}

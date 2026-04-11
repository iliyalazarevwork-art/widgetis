<?php

declare(strict_types=1);

namespace App\Services\Widget;

enum ProductAccessState: string
{
    case Available = 'available';
    case Locked = 'locked';
    case ComingSoon = 'coming_soon';
    case Archived = 'archived';
}

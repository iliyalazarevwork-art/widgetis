<?php

declare(strict_types=1);

namespace App\Enums;

enum ProductAvailability: string
{
    case Available = 'available';
    case ComingSoon = 'coming_soon';
    case Archived = 'archived';
}

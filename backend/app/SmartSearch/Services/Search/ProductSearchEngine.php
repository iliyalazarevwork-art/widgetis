<?php

declare(strict_types=1);

namespace App\SmartSearch\Services\Search;

use App\SmartSearch\DataTransferObjects\SearchQueryDto;
use App\SmartSearch\DataTransferObjects\SearchResponseDto;

interface ProductSearchEngine
{
    public function search(SearchQueryDto $query): SearchResponseDto;
}

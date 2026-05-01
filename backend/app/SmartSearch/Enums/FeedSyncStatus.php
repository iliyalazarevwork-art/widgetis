<?php

declare(strict_types=1);

namespace App\SmartSearch\Enums;

enum FeedSyncStatus: string
{
    case Idle = 'idle';
    case Syncing = 'syncing';
    case Success = 'success';
    case Failed = 'failed';
}

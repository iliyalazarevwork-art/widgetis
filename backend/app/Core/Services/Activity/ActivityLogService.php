<?php

declare(strict_types=1);

namespace App\Core\Services\Activity;

use App\Core\Models\ActivityLog;

class ActivityLogService
{
    /**
     * @param array<string, mixed>|null $description
     * @param array<string, mixed>|null $metadata
     */
    public function log(
        ?string $userId,
        string $action,
        ?string $entityType = null,
        int|string|null $entityId = null,
        ?array $description = null,
        ?array $metadata = null,
    ): ActivityLog {
        return ActivityLog::create([
            'user_id' => $userId,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'description' => $description,
            'metadata' => $metadata,
            'created_at' => now(),
        ]);
    }
}

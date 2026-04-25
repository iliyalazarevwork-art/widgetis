<?php

declare(strict_types=1);

namespace App\Shared\Contracts;

interface WidgetCatalogInterface
{
    public function widgetExistsBySlug(string $slug): bool;

    /** @return list<string> */
    public function availableSlugsForPlan(string $planSlug): array;

    /**
     * @return array<string, mixed>|null
     */
    public function getConfigSchemaBySlug(string $slug): ?array;
}

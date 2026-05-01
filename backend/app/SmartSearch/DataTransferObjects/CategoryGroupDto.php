<?php

declare(strict_types=1);

namespace App\SmartSearch\DataTransferObjects;

final readonly class CategoryGroupDto
{
    private function __construct(
        public string $name,
        public int $total,
        /** @var list<ProductHitDto> */
        public array $items,
    ) {
    }

    /**
     * @param list<ProductHitDto> $items
     */
    public static function create(string $name, int $total, array $items): self
    {
        return new self(name: $name, total: $total, items: $items);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'total' => $this->total,
            'items' => array_map(static fn (ProductHitDto $hit): array => $hit->toArray(), $this->items),
        ];
    }
}

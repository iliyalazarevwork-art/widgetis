<?php

declare(strict_types=1);

namespace App\SmartSearch\DataTransferObjects;

final readonly class SearchResponseDto
{
    private function __construct(
        public string $query,
        public ?string $correction,
        public int $total,
        public bool $loading,
        public ?string $accentColor,
        public string $currency,
        /** @var array<string, string> */
        public array $categoryUrls,
        /** @var array<string, bool> */
        public array $features,
        /** @var array<string, CategoryGroupDto> */
        public array $groups,
    ) {
    }

    /**
     * @param array<string, string>      $categoryUrls
     * @param array<string, bool>        $features
     * @param array<string, CategoryGroupDto> $groups
     */
    public static function create(
        string $query,
        ?string $correction,
        int $total,
        ?string $accentColor,
        string $currency,
        array $categoryUrls,
        array $features,
        array $groups,
        bool $loading = false,
    ): self {
        return new self(
            query: $query,
            correction: $correction,
            total: $total,
            loading: $loading,
            accentColor: $accentColor,
            currency: $currency,
            categoryUrls: $categoryUrls,
            features: $features,
            groups: $groups,
        );
    }

    /**
     * Restore from a cached array produced by toArray().
     *
     * @param array<string, mixed> $data
     */
    public static function fromCacheArray(array $data): self
    {
        $groups = [];
        foreach ((array) ($data['groups'] ?? []) as $name => $group) {
            $items = [];
            foreach ((array) ($group['items'] ?? []) as $item) {
                $items[] = ProductHitDto::fromArray((array) $item);
            }
            $groups[(string) $name] = CategoryGroupDto::create(
                name: (string) $name,
                total: (int) $group['total'],
                items: $items,
            );
        }

        return new self(
            query: (string) ($data['query'] ?? ''),
            correction: isset($data['correction']) ? (string) $data['correction'] : null,
            total: (int) ($data['total'] ?? 0),
            loading: false,
            accentColor: isset($data['accentColor']) ? (string) $data['accentColor'] : null,
            currency: (string) ($data['currency'] ?? 'грн'),
            categoryUrls: (array) ($data['categoryUrls'] ?? []),
            features: (array) ($data['features'] ?? []),
            groups: $groups,
        );
    }

    /**
     * Produces the exact JSON contract shape the frontend expects.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $groups = [];
        foreach ($this->groups as $name => $group) {
            $groups[$name] = $group->toArray();
        }

        return [
            'query'        => $this->query,
            'correction'   => $this->correction,
            'total'        => $this->total,
            'loading'      => $this->loading,
            'accentColor'  => $this->accentColor,
            'currency'     => $this->currency,
            'categoryUrls' => $this->categoryUrls,
            'features'     => $this->features,
            'groups'       => $groups,
        ];
    }
}

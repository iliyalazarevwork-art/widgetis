<?php

declare(strict_types=1);

namespace App\SmartSearch\DataTransferObjects;

use App\SmartSearch\Models\SiteSearchProduct;

final readonly class ProductHitDto
{
    private function __construct(
        public string $id,
        public string $url,
        public string $name,
        public int $price,
        public int $oldprice,
        public string $picture,
        public bool $available,
        public string $vendor,
    ) {
    }

    public static function fromModel(SiteSearchProduct $p): self
    {
        return new self(
            id: (string) $p->external_id,
            url: (string) $p->url,
            name: (string) $p->name,
            price: (int) $p->price,
            oldprice: (int) $p->oldprice,
            picture: (string) ($p->picture ?? ''),
            available: (bool) $p->available,
            vendor: (string) ($p->vendor ?? ''),
        );
    }

    /**
     * Build from a raw stdClass row returned by DB::select().
     *
     * @param object $row
     */
    public static function fromRow(object $row): self
    {
        return new self(
            id: (string) $row->external_id,
            url: (string) $row->url,
            name: (string) $row->name,
            price: (int) ($row->price ?? 0),
            oldprice: (int) ($row->oldprice ?? 0),
            picture: (string) ($row->picture ?? ''),
            available: (bool) $row->available,
            vendor: (string) ($row->vendor ?? ''),
        );
    }

    /**
     * Build from a cached array produced by toArray().
     *
     * @param array<string, mixed> $item
     */
    public static function fromArray(array $item): self
    {
        return new self(
            id: (string) $item['id'],
            url: (string) $item['url'],
            name: (string) $item['name'],
            price: (int) $item['price'],
            oldprice: (int) $item['oldprice'],
            picture: (string) $item['picture'],
            available: (bool) $item['available'],
            vendor: (string) $item['vendor'],
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'id'        => $this->id,
            'url'       => $this->url,
            'name'      => $this->name,
            'price'     => $this->price,
            'oldprice'  => $this->oldprice,
            'picture'   => $this->picture,
            'available' => $this->available,
            'vendor'    => $this->vendor,
        ];
    }
}

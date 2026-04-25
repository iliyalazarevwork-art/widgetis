<?php

declare(strict_types=1);

namespace App\WidgetRuntime\DataTransferObjects\Reviews;

/**
 * Immutable value object representing one uploaded media item attached to a review.
 */
final readonly class ReviewMediaItem
{
    private function __construct(
        /** 'photo' or 'video' */
        public string $type,
        public string $url,
        public string $mimeType,
        /** File size in bytes */
        public int $size,
    ) {
    }

    public static function photo(string $url, string $mimeType, int $size): self
    {
        return new self(type: 'photo', url: $url, mimeType: $mimeType, size: $size);
    }

    public static function video(string $url, string $mimeType, int $size): self
    {
        return new self(type: 'video', url: $url, mimeType: $mimeType, size: $size);
    }

    /**
     * Serialize to array for storage in the jsonb media column.
     *
     * @return array{type: string, url: string, mime_type: string, size: int}
     */
    public function toArray(): array
    {
        return [
            'type'      => $this->type,
            'url'       => $this->url,
            'mime_type' => $this->mimeType,
            'size'      => $this->size,
        ];
    }
}

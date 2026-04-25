<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Actions\Reviews;

use App\WidgetRuntime\DataTransferObjects\Reviews\ReviewMediaItem;
use App\WidgetRuntime\Models\Site;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Uploads review media files to R2 and returns typed ReviewMediaItem DTOs.
 *
 * Each file gets a stable, collision-resistant path:
 *   reviews/{site_id}/{review_id}/{uuid7}.{ext}
 */
final class UploadReviewMediaAction
{
    /**
     * @param list<UploadedFile>   $photos
     * @return list<ReviewMediaItem>
     */
    public function execute(
        Site $site,
        int $reviewId,
        array $photos = [],
        ?UploadedFile $video = null,
    ): array {
        $items = [];

        foreach ($photos as $photo) {
            $items[] = $this->upload($site, $reviewId, $photo, 'photo');
        }

        if ($video !== null) {
            $items[] = $this->upload($site, $reviewId, $video, 'video');
        }

        return $items;
    }

    private function upload(Site $site, int $reviewId, UploadedFile $file, string $type): ReviewMediaItem
    {
        $ext      = $file->getClientOriginalExtension() ?: $file->guessExtension() ?: 'bin';
        $uuid     = Str::uuid()->toString();
        $key      = "reviews/{$site->id}/{$reviewId}/{$uuid}.{$ext}";

        Storage::disk('r2')->putFileAs(
            path: dirname($key),
            file: $file,
            name: basename($key),
            options: ['visibility' => 'public'],
        );

        $url = Storage::disk('r2')->url($key);

        return match ($type) {
            'photo' => ReviewMediaItem::photo(
                url: $url,
                mimeType: $file->getMimeType() ?? 'application/octet-stream',
                size: $file->getSize() ?: 0,
            ),
            default => ReviewMediaItem::video(
                url: $url,
                mimeType: $file->getMimeType() ?? 'application/octet-stream',
                size: $file->getSize() ?: 0,
            ),
        };
    }
}

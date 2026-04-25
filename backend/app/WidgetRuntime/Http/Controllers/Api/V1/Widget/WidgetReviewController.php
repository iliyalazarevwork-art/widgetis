<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Http\Controllers\Api\V1\Widget;

use App\Enums\ReviewStatus;
use App\Http\Controllers\Api\V1\BaseController;
use App\WidgetRuntime\Actions\Reviews\UploadReviewMediaAction;
use App\WidgetRuntime\Http\Requests\Widget\Reviews\StoreReviewRequest;
use App\WidgetRuntime\Models\Review;
use App\WidgetRuntime\Models\Site;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class WidgetReviewController extends BaseController
{
    /**
     * POST api/v1/widget/reviews
     *
     * Receives a photo-review submission from a merchant's storefront.
     * The Site is resolved by ResolveSiteFromOrigin middleware.
     */
    public function store(StoreReviewRequest $request, UploadReviewMediaAction $upload): JsonResponse
    {
        /** @var Site $site */
        $site = $request->attributes->get('site');

        $review = Review::create([
            'site_id'             => $site->id,
            'external_product_id' => $request->string('external_product_id')->toString(),
            'visitor_name'        => $request->string('visitor_name')->toString() ?: null,
            'visitor_email'       => $request->string('visitor_email')->toString() ?: null,
            'body'                => $request->string('text')->toString(),
            'rating'              => $request->integer('rating') ?: null,
            'status'              => ReviewStatus::Approved,
            'media'               => [],
            'user_id'             => null,
        ]);

        /** @var list<\Illuminate\Http\UploadedFile> $photos */
        $photos = $request->hasFile('photos')
            ? array_values(array_filter((array) $request->file('photos')))
            : [];

        $video = $request->hasFile('video') ? $request->file('video') : null;

        $mediaItems = $upload->execute(
            site: $site,
            reviewId: $review->id,
            photos: $photos,
            video: $video,
        );

        $review->update([
            'media' => array_map(fn ($item) => $item->toArray(), $mediaItems),
        ]);

        return $this->created([
            'data' => [
                'id'    => $review->id,
                'media' => $review->media,
            ],
        ]);
    }

    /**
     * GET api/v1/widget/reviews?external_product_id=…
     *
     * Returns approved reviews with media for a specific product.
     */
    public function index(Request $request): JsonResponse
    {
        /** @var Site $site */
        $site = $request->attributes->get('site');

        $productId = $request->string('external_product_id')->trim()->toString();

        if ($productId === '') {
            return $this->error('VALIDATION_ERROR', 'The external_product_id query parameter is required.', 422);
        }

        $paginator = Review::forProduct($site->id, $productId)
            ->withMedia()
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        $data = $paginator->map(fn (Review $r) => [
            'id'           => $r->id,
            'visitor_name' => $r->visitor_name,
            'body'         => $r->body,
            'rating'       => $r->rating,
            'media'        => $r->media,
            'created_at'   => $r->created_at?->toIso8601String(),
        ])->values()->all();

        return response()->json([
            'data' => $data,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
            ],
        ]);
    }
}

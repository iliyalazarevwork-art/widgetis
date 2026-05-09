<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Http\Controllers\Api\V1\Widget;

use App\Enums\ReviewStatus;
use App\Http\Controllers\Api\V1\BaseController;
use App\WidgetRuntime\Actions\Reviews\UploadReviewMediaAction;
use App\WidgetRuntime\Http\Requests\Widget\Reviews\MatchReviewsRequest;
use App\WidgetRuntime\Http\Requests\Widget\Reviews\StoreReviewRequest;
use App\WidgetRuntime\Models\Review;
use App\WidgetRuntime\Models\Site;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class WidgetReviewController extends BaseController
{
    /**
     * Maximum approved reviews loaded per site for the match lookup.
     * Sites are expected to stay well under this for the foreseeable future;
     * raise it (or switch to chunked matching) when that stops being true.
     */
    private const MATCH_REVIEW_LIMIT = 500;

    /**
     * POST api/v1/widgets/reviews
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
     * GET api/v1/widgets/reviews?external_product_id=…
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

    /**
     * POST api/v1/widgets/reviews/match
     *
     * Body: { candidates: [{ name, body }, ...] }
     * Response: { matches: [{ name, body, media }, ...] }
     *
     * The storefront walks DOM review blocks and posts the visible
     * (visitor_name, body) pairs. We look up approved reviews with media
     * for the resolved Site (Origin → site_id), match by normalised
     * name + body containment, and echo back the candidate's name/body
     * plus any media we hold so the client can attach galleries.
     */
    public function match(MatchReviewsRequest $request): JsonResponse
    {
        /** @var Site $site */
        $site = $request->attributes->get('site');

        /** @var list<array{name?: string, body?: string}> $candidates */
        $candidates = (array) $request->input('candidates', []);

        $reviews = Review::approved()
            ->where('site_id', $site->id)
            ->withMedia()
            ->orderBy('created_at', 'desc')
            ->limit(self::MATCH_REVIEW_LIMIT)
            ->get(['visitor_name', 'body', 'media']);

        $matches = [];
        foreach ($candidates as $candidate) {
            $rawName = (string) ($candidate['name'] ?? '');
            $rawBody = (string) ($candidate['body'] ?? '');

            $candName = self::normalise($rawName);
            $candBody = self::normalise($rawBody);

            // Need at least one signal to match; otherwise we'd attach media to
            // every nameless/bodyless DOM node which is clearly wrong.
            if ($candName === '' && $candBody === '') {
                continue;
            }

            foreach ($reviews as $review) {
                $dbName = self::normalise((string) ($review->visitor_name ?? ''));
                $dbBody = self::normalise((string) ($review->body ?? ''));

                $nameOk = $candName !== '' && $dbName !== '' && $dbName === $candName;
                $bodyOk = $candBody !== '' && $dbBody !== ''
                    && (str_contains($dbBody, $candBody) || str_contains($candBody, $dbBody));

                // Both signals must agree when both are present; if either side
                // has no body, fall back to a strict name-only match (Horoshop
                // sometimes truncates very short comments out of the carousel).
                $hasBoth = $candBody !== '' && $dbBody !== '';
                $matched = $hasBoth ? ($nameOk && $bodyOk) : $nameOk;

                if (! $matched) {
                    continue;
                }

                $matches[] = [
                    'name'  => $rawName,
                    'body'  => $rawBody,
                    'media' => $review->media,
                ];

                break; // first match wins — no duplicate galleries.
            }
        }

        return response()->json(['matches' => $matches]);
    }

    private static function normalise(string $value): string
    {
        $value = mb_strtolower($value);
        $value = (string) preg_replace('/\s+/u', ' ', $value);

        return trim($value);
    }
}

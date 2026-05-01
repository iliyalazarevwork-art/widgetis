<?php

declare(strict_types=1);

namespace App\SmartSearch\Http\Controllers;

use App\SmartSearch\DataTransferObjects\SearchQueryDto;
use App\SmartSearch\Exceptions\InvalidSearchQueryException;
use App\SmartSearch\Http\Requests\SearchProductsRequest;
use App\SmartSearch\Services\Search\SearchAction;
use App\WidgetRuntime\Models\Site;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

final class PublicSearchController
{
    public function __invoke(SearchProductsRequest $request, SearchAction $action): JsonResponse|Response
    {
        /** @var Site $site */
        $site = $request->attributes->get('site');

        try {
            $dto = SearchQueryDto::fromRequest($request, $site);
            $result = $action($dto);
        } catch (InvalidSearchQueryException $e) {
            return response()->json([
                'error' => [
                    'code'    => 'INVALID_QUERY',
                    'message' => $e->getMessage(),
                ],
            ], 400);
        }

        $body = json_encode($result->toArray(), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        if ($body === false) {
            return response()->json(['error' => ['code' => 'ENCODE_ERROR', 'message' => 'Failed to encode response.']], 500);
        }

        $etag = 'W/"' . sha1($body) . '"';

        $ifNoneMatch = $request->header('If-None-Match');

        if ($ifNoneMatch === $etag) {
            return response('', 304)
                ->header('ETag', $etag)
                ->header('Cache-Control', 'public, max-age=60, stale-while-revalidate=600');
        }

        return response()->json(
            $result->toArray(),
            200,
            [
                'Cache-Control' => 'public, max-age=60, stale-while-revalidate=600',
                'ETag'          => $etag,
                'Vary'          => 'Origin, Accept-Language',
            ],
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES,
        );
    }
}

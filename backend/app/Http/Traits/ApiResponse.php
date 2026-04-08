<?php

declare(strict_types=1);

namespace App\Http\Traits;

use Illuminate\Http\JsonResponse;
use Illuminate\Pagination\LengthAwarePaginator;

trait ApiResponse
{
    protected function success(mixed $data = null, int $status = 200): JsonResponse
    {
        if ($data === null) {
            return response()->json(null, 204);
        }

        return response()->json($data, $status);
    }

    protected function created(mixed $data): JsonResponse
    {
        return response()->json($data, 201);
    }

    protected function noContent(): JsonResponse
    {
        return response()->json(null, 204);
    }

    /**
     * @param LengthAwarePaginator<int, mixed> $paginator
     * @param array<string, mixed> $extra
     */
    protected function paginated(LengthAwarePaginator $paginator, array $extra = []): JsonResponse
    {
        $response = [
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ];

        if (!empty($extra)) {
            $response = array_merge($response, $extra);
        }

        return response()->json($response);
    }

    /**
     * @param array<string, mixed> $details
     */
    protected function error(string $code, string $message, int $status = 400, array $details = []): JsonResponse
    {
        $body = [
            'error' => [
                'code' => $code,
                'message' => $message,
            ],
        ];

        if (!empty($details)) {
            $body['error']['details'] = $details;
        }

        return response()->json($body, $status);
    }
}

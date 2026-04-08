<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Api\V1\BaseController;
use App\Models\ManagerRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ManagerRequestController extends BaseController
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'messenger' => ['required', 'string', 'in:telegram,viber,whatsapp'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'widgets' => ['nullable', 'array'],
            'message' => ['nullable', 'string', 'max:2000'],
        ]);

        $mr = ManagerRequest::create(array_merge(
            $request->only(['messenger', 'email', 'phone', 'widgets', 'message']),
            ['type' => 'demo_request', 'status' => 'new'],
        ));

        return $this->created(['data' => ['id' => $mr->id, 'status' => $mr->status]]);
    }
}

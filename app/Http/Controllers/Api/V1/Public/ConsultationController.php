<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Api\V1\BaseController;
use App\Models\Consultation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConsultationController extends BaseController
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:255'],
            'preferred_at' => ['nullable', 'date'],
        ]);

        $consultation = Consultation::create(array_merge(
            $request->only(['name', 'phone', 'email', 'preferred_at']),
            ['status' => 'new'],
        ));

        return $this->created(['data' => ['id' => $consultation->id, 'status' => $consultation->status]]);
    }
}

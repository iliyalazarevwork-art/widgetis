<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Http\Requests\Widget\Reviews;

use Illuminate\Foundation\Http\FormRequest;

final class MatchReviewsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'candidates'        => ['required', 'array', 'min:1', 'max:200'],
            'candidates.*.name' => ['present', 'string', 'max:200'],
            'candidates.*.body' => ['present', 'string', 'max:1000'],
        ];
    }
}

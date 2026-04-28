<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Http\Requests\Widget\OnePlusOne;

use Illuminate\Foundation\Http\FormRequest;

final class EvaluateRequest extends FormRequest
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
            'cart'               => ['required', 'array', 'min:1'],
            'cart.*.id'          => ['required', 'integer'],
            'cart.*.price'       => ['required', 'numeric', 'min:0'],
            'cart.*.quantity'    => ['required', 'integer', 'min:1'],
            'cart.*.article'     => ['sometimes', 'string'],
        ];
    }
}

<?php

declare(strict_types=1);

namespace App\SmartSearch\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateFeedRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string>|string>
     */
    public function rules(): array
    {
        return [
            'feed_url'    => ['required', 'url', 'max:500'],
            'sitemap_url' => ['sometimes', 'nullable', 'url', 'max:500'],
            'lang'        => ['required', 'string', 'in:uk,ru,en,pl'],
        ];
    }
}

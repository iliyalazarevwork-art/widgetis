<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Http\Requests\Widget\Reviews;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

final class StoreReviewRequest extends FormRequest
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
            'visitor_name'        => ['required', 'string', 'max:120'],
            'visitor_email'       => ['nullable', 'email', 'max:180'],
            'text'                => ['required', 'string', 'max:5000'],
            'rating'              => ['nullable', 'integer', 'between:1,5'],
            'external_product_id' => ['required', 'string', 'max:200'],
            // Either photos OR video — at least one must be present.
            'photos'              => ['required_without:video', 'array', 'max:5'],
            'photos.*'            => ['file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'video'               => ['required_without:photos', 'file', 'mimes:mp4,webm,mov,quicktime', 'max:30720'],
        ];
    }

    /**
     * Prevent uploading both photos and a video in the same request.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            $hasPhotos = $this->hasFile('photos') && count((array) $this->file('photos')) > 0;
            $hasVideo  = $this->hasFile('video');

            if ($hasPhotos && $hasVideo) {
                $v->errors()->add('photos', 'You may not upload photos and a video at the same time.');
                $v->errors()->add('video', 'You may not upload photos and a video at the same time.');
            }
        });
    }
}

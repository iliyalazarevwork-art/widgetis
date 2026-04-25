<?php

declare(strict_types=1);

namespace App\Core\Models;

use App\Shared\Concerns\HasTranslations;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class FaqItem extends Model
{
    use HasTranslations;

    /** @var list<string> */
    public array $translatable = ['question', 'answer'];

    /** @var list<string> */
    protected $fillable = ['category', 'question', 'answer', 'sort_order', 'is_published'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'question' => 'array',
            'answer' => 'array',
            'is_published' => 'boolean',
        ];
    }

    /**
     * @param Builder<FaqItem> $query
     * @return Builder<FaqItem>
     */
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_published', true);
    }
}

<?php

declare(strict_types=1);

namespace App\Core\Models;

use App\Core\Models\Concerns\HasTranslations;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WidgetTag extends Model
{
    use HasTranslations;

    protected $primaryKey = 'slug';
    public $incrementing = false;
    protected $keyType = 'string';

    /** @var list<string> */
    public array $translatable = ['name'];

    /** @var list<string> */
    protected $fillable = [
        'slug',
        'name',
        'color',
        'sort_order',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'name' => 'array',
        ];
    }

    /**
     * @return HasMany<Product, $this>
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'tag_slug', 'slug');
    }
}

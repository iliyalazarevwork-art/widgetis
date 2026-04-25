<?php

declare(strict_types=1);

namespace App\Core\Models;

use App\Shared\Concerns\HasTranslations;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PlanFeature extends Model
{
    use HasTranslations;

    /** @var list<string> */
    public array $translatable = ['name'];

    /** @var list<string> */
    protected $fillable = [
        'feature_key',
        'name',
        'category',
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
     * @return HasMany<PlanFeatureValue, $this>
     */
    public function values(): HasMany
    {
        return $this->hasMany(PlanFeatureValue::class);
    }
}

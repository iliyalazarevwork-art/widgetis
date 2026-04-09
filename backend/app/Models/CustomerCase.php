<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\HasTranslations;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CustomerCase extends Model
{
    use HasTranslations;
    use SoftDeletes;

    protected $table = 'customer_cases';

    /** @var list<string> */
    public array $translatable = ['description'];

    /** @var list<string> */
    protected $fillable = [
        'store', 'store_url', 'store_logo_url', 'owner', 'platform',
        'description', 'review_text', 'review_rating', 'result_metric', 'result_period',
        'color', 'screenshot_urls', 'widgets', 'is_published', 'sort_order',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'description' => 'array',
            'screenshot_urls' => 'array',
            'widgets' => 'array',
            'is_published' => 'boolean',
        ];
    }
}

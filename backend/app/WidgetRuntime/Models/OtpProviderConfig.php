<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Models;

use App\Models\Concerns\HasUuidV7;
use App\WidgetRuntime\Services\Widget\SmsOtp\Channel;
use App\WidgetRuntime\Services\Widget\SmsOtp\Provider;
use Database\Factories\OtpProviderConfigFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property Channel $channel
 * @property Provider $provider
 * @property array<string, mixed> $credentials
 * @property array<string, string> $templates
 * @use HasFactory<OtpProviderConfigFactory>
 */
class OtpProviderConfig extends Model
{
    /** @use HasFactory<OtpProviderConfigFactory> */
    use HasFactory;
    use HasUuidV7;

    protected $connection = 'pgsql_runtime';

    protected static function newFactory(): OtpProviderConfigFactory
    {
        return OtpProviderConfigFactory::new();
    }

    protected $table = 'wgt_otp_provider_configs';

    /** @var list<string> */
    protected $fillable = [
        'site_id',
        'provider',
        'channel',
        'credentials',
        'sender_name',
        'templates',
        'is_active',
        'priority',
    ];

    /**
     * @return array<string, mixed>
     */
    protected function casts(): array
    {
        return [
            'provider' => Provider::class,
            'channel' => Channel::class,
            'credentials' => 'encrypted:array',
            'templates' => 'array',
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<Site, $this>
     */
    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }
}

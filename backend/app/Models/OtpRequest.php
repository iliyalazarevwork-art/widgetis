<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\HasUuidV7;
use App\Services\Widget\SmsOtp\Channel;
use App\Services\Widget\SmsOtp\OtpRequestStatus;
use App\Services\Widget\SmsOtp\Provider;
use Database\Factories\OtpRequestFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property Channel $channel
 * @property Provider $provider
 * @property OtpRequestStatus $status
 * @property Carbon $expires_at
 * @property Carbon|null $sent_at
 * @property Carbon|null $verified_at
 */
class OtpRequest extends Model
{
    /** @use HasFactory<OtpRequestFactory> */
    use HasFactory;
    use HasUuidV7;

    /** @var list<string> */
    protected $fillable = [
        'site_id',
        'request_id',
        'phone',
        'code_hash',
        'provider',
        'channel',
        'status',
        'attempts',
        'ip',
        'user_agent',
        'utm_source',
        'expires_at',
        'sent_at',
        'verified_at',
    ];

    /**
     * @return array<string, mixed>
     */
    protected function casts(): array
    {
        return [
            'provider' => Provider::class,
            'channel' => Channel::class,
            'status' => OtpRequestStatus::class,
            'expires_at' => 'datetime',
            'sent_at' => 'datetime',
            'verified_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Site, $this>
     */
    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function isVerified(): bool
    {
        return $this->status === OtpRequestStatus::Verified;
    }
}

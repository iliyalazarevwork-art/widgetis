<?php

declare(strict_types=1);

namespace App\Services\Widget\SmsOtp;

use App\Models\Site;
use App\Services\Widget\SmsOtp\Exceptions\OtpInvalidWidgetSessionException;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Support\Str;

final class WidgetSessionTokenService
{
    private const AUDIENCE = 'widget';
    private const TTL_SECONDS = 1800; // 30 minutes
    private const ALGORITHM = 'HS256';

    /**
     * @return array{token: string, expires_at: string}
     */
    public function issue(Site $site): array
    {
        $secret = $this->secret();
        $now = time();
        $expiresAt = $now + self::TTL_SECONDS;

        $payload = [
            'iss' => config('app.url'),
            'aud' => self::AUDIENCE,
            'sub' => (string) $site->id,
            'iat' => $now,
            'exp' => $expiresAt,
            'jti' => (string) Str::uuid(),
        ];

        $token = JWT::encode($payload, $secret, self::ALGORITHM);

        return [
            'token' => $token,
            'expires_at' => date('c', $expiresAt),
        ];
    }

    public function verify(string $token): Site
    {
        $secret = $this->secret();

        try {
            $decoded = JWT::decode($token, new Key($secret, self::ALGORITHM));
        } catch (\Throwable $e) {
            throw new OtpInvalidWidgetSessionException('Invalid widget session token: ' . $e->getMessage());
        }

        $aud = property_exists($decoded, 'aud') ? (string) $decoded->aud : '';

        if ($aud !== self::AUDIENCE) {
            throw new OtpInvalidWidgetSessionException('Token audience mismatch');
        }

        $siteId = property_exists($decoded, 'sub') ? (string) $decoded->sub : '';

        $site = Site::find($siteId);

        if ($site === null) {
            throw new OtpInvalidWidgetSessionException('Site not found for widget session');
        }

        return $site;
    }

    private function secret(): string
    {
        $secret = config('jwt.secret');

        if (! is_string($secret) || $secret === '') {
            throw new \RuntimeException('JWT secret is not configured');
        }

        return $secret;
    }
}

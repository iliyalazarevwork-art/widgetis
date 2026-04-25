<?php

declare(strict_types=1);

namespace App\Core\Services\Auth;

use App\Exceptions\Auth\LinkAlreadyUsedException;
use App\Exceptions\Auth\LinkExpiredException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class LinkService
{
    /**
     * Confirm a magic link (user clicked the link in email).
     * Marks the token as "confirmed" while preserving remaining TTL.
     * User creation / JWT issuance happens at the polling step.
     *
     * @throws LinkExpiredException
     * @throws LinkAlreadyUsedException
     */
    public function confirm(string $token): void
    {
        $key = $this->key($token);
        $raw = Redis::get($key);

        if ($raw === null) {
            throw new LinkExpiredException();
        }

        /** @var array{email: string, status: string} $data */
        $data = json_decode($raw, true);

        if ($data['status'] === 'confirmed') {
            throw new LinkAlreadyUsedException();
        }

        $data['status'] = 'confirmed';
        $remaining      = max((int) Redis::ttl($key), 1);
        Redis::setex($key, $remaining, json_encode($data));

        Log::channel('auth')->info('Magic link confirmed', ['email' => $data['email']]);
    }

    /**
     * Return the current status of a magic link token (frontend polling).
     *
     * @return array{status: string, email: string}
     *
     * @throws LinkExpiredException
     */
    public function status(string $token): array
    {
        $raw = Redis::get($this->key($token));

        if ($raw === null) {
            throw new LinkExpiredException();
        }

        /** @var array{email: string, status: string} $data */
        $data = json_decode($raw, true);

        return [
            'status' => $data['status'],
            'email'  => $data['email'],
        ];
    }

    private function key(string $token): string
    {
        return "otp:link:{$token}";
    }
}

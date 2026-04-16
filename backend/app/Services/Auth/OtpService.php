<?php

declare(strict_types=1);

namespace App\Services\Auth;

use App\Exceptions\OtpCooldownException;
use App\Exceptions\TooManyOtpAttemptsException;
use App\Mail\Auth\OtpMail;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;

class OtpService
{
    private const TTL_SECONDS = 600;
    private const MAX_ATTEMPTS = 5;
    private const COOLDOWN_SECONDS = 30;
    private const CODE_LENGTH = 6;

    /**
     * Generate OTP code + magic link token, store both in Redis, send email.
     *
     * @return string Magic link token (UUID) to be returned to the frontend for polling.
     */
    public function send(string $email): string
    {
        Log::channel('auth')->info('auth.otp.send.in', [
            'email' => $email,
            'ip' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);

        $this->enforceCooldown($email);

        $code       = $this->generateCode();
        $magicToken = (string) Str::uuid();

        Cache::put($this->codeKey($email), $code, self::TTL_SECONDS);
        Cache::put($this->attemptsKey($email), 0, self::TTL_SECONDS);
        Cache::put($this->cooldownKey($email), true, self::COOLDOWN_SECONDS);

        // Store magic link state for LinkService to read
        Redis::setex(
            "otp:link:{$magicToken}",
            self::TTL_SECONDS,
            json_encode(['email' => $email, 'status' => 'pending']),
        );

        Mail::to($email)->queue(new OtpMail($code, $magicToken));

        Log::channel('auth')->info('auth.otp.send.out', [
            'email' => $email,
            'expires_in_seconds' => self::TTL_SECONDS,
            'cooldown_seconds' => self::COOLDOWN_SECONDS,
        ]);

        return $magicToken;
    }

    public function verify(string $email, string $code): bool
    {
        Log::channel('auth')->info('auth.otp.verify.in', [
            'email' => $email,
            'ip' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);

        // Dev bypass: accept master code without cache lookup (admin only)
        if ($this->isDevBypass($email, $code)) {
            $this->invalidate($email);
            Log::channel('auth')->info('auth.otp.verify.out', [
                'email' => $email,
                'result' => 'success',
                'mode' => 'dev_bypass',
            ]);
            return true;
        }

        $attempts = (int) Cache::get($this->attemptsKey($email), 0);

        if ($attempts >= self::MAX_ATTEMPTS) {
            $this->invalidate($email);
            Log::channel('auth')->warning('auth.otp.verify.out', [
                'email' => $email,
                'result' => 'too_many_attempts',
                'max_attempts' => self::MAX_ATTEMPTS,
            ]);
            throw new TooManyOtpAttemptsException();
        }

        Cache::increment($this->attemptsKey($email));

        $storedCode = Cache::get($this->codeKey($email));

        if ($storedCode === null || $storedCode !== $code) {
            Log::channel('auth')->warning('auth.otp.verify.out', [
                'email' => $email,
                'result' => 'invalid_code',
            ]);
            return false;
        }

        $this->invalidate($email);

        Log::channel('auth')->info('auth.otp.verify.out', [
            'email' => $email,
            'result' => 'success',
        ]);

        return true;
    }

    private function isDevBypass(string $email, string $code): bool
    {
        // Hard guard: in production the master OTP code is NEVER honoured, even
        // if OTP_DEV_BYPASS somehow leaks into the production env file. A stale
        // flag here used to be a full auth-bypass — see SecurityOtpDevBypassProdTest.
        if (app()->environment('production')) {
            return false;
        }

        if (! (bool) config('app.otp_dev_bypass', false)) {
            return false;
        }

        $masterCode = (string) config('app.otp_dev_code', '121212');

        return $code === $masterCode;
    }

    public function invalidate(string $email): void
    {
        Log::channel('auth')->info('auth.otp.invalidate.in', [
            'email' => $email,
        ]);

        Cache::forget($this->codeKey($email));
        Cache::forget($this->attemptsKey($email));

        Log::channel('auth')->info('auth.otp.invalidate.out', [
            'email' => $email,
        ]);
    }

    private function generateCode(): string
    {
        return str_pad((string) random_int(0, 999999), self::CODE_LENGTH, '0', STR_PAD_LEFT);
    }

    private function enforceCooldown(string $email): void
    {
        if (Cache::has($this->cooldownKey($email))) {
            Log::channel('auth')->warning('auth.otp.send.out', [
                'email' => $email,
                'result' => 'cooldown_active',
                'cooldown_seconds' => self::COOLDOWN_SECONDS,
            ]);
            throw new OtpCooldownException();
        }
    }

    private function codeKey(string $email): string
    {
        return "otp:code:{$email}";
    }

    private function attemptsKey(string $email): string
    {
        return "otp:attempts:{$email}";
    }

    private function cooldownKey(string $email): string
    {
        return "otp:cooldown:{$email}";
    }
}

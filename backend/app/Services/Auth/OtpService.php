<?php

declare(strict_types=1);

namespace App\Services\Auth;

use App\Enums\UserRole;
use App\Exceptions\OtpCooldownException;
use App\Exceptions\TooManyOtpAttemptsException;
use App\Mail\Auth\OtpMail;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;

class OtpService
{
    private const TTL_SECONDS = 600;
    private const MAX_ATTEMPTS = 5;
    private const COOLDOWN_SECONDS = 30;
    private const CODE_LENGTH = 6;

    public function send(string $email): void
    {
        $this->enforceCooldown($email);

        $code = $this->generateCode();

        Cache::put(
            $this->codeKey($email),
            $code,
            self::TTL_SECONDS,
        );
        Cache::put(
            $this->attemptsKey($email),
            0,
            self::TTL_SECONDS,
        );
        Cache::put(
            $this->cooldownKey($email),
            true,
            self::COOLDOWN_SECONDS,
        );

        Mail::to($email)->queue(new OtpMail($code));
    }

    public function verify(string $email, string $code): bool
    {
        // Dev bypass: accept master code without cache lookup (admin only)
        if ($this->isDevBypass($email, $code)) {
            $this->invalidate($email);
            return true;
        }

        $attempts = (int) Cache::get($this->attemptsKey($email), 0);

        if ($attempts >= self::MAX_ATTEMPTS) {
            $this->invalidate($email);
            throw new TooManyOtpAttemptsException();
        }

        Cache::increment($this->attemptsKey($email));

        $storedCode = Cache::get($this->codeKey($email));

        if ($storedCode === null || $storedCode !== $code) {
            return false;
        }

        $this->invalidate($email);

        return true;
    }

    private function isDevBypass(string $email, string $code): bool
    {
        if (! (bool) config('app.otp_dev_bypass', false)) {
            return false;
        }

        $masterCode = (string) config('app.otp_dev_code', '121212');

        if ($code !== $masterCode) {
            return false;
        }

        $user = User::where('email', $email)->first();

        return $user !== null && $user->hasRole(UserRole::Admin->value);
    }

    public function invalidate(string $email): void
    {
        Cache::forget($this->codeKey($email));
        Cache::forget($this->attemptsKey($email));
    }

    private function generateCode(): string
    {
        return str_pad((string) random_int(0, 999999), self::CODE_LENGTH, '0', STR_PAD_LEFT);
    }

    private function enforceCooldown(string $email): void
    {
        if (Cache::has($this->cooldownKey($email))) {
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

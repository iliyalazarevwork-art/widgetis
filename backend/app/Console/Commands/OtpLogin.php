<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\Auth\OtpService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class OtpLogin extends Command
{
    protected $signature = 'otp:login {email}';
    protected $description = 'Send OTP and immediately print the code (dev shortcut)';

    public function handle(OtpService $otpService): int
    {
        $email = $this->argument('email');

        try {
            $otpService->send($email);
        } catch (\Throwable $e) {
            // Cooldown — code already exists, just read it
            $code = Cache::get("otp:code:{$email}");
            if ($code) {
                $this->line($code);
                return 0;
            }
            $this->error($e->getMessage());
            return 1;
        }

        $code = Cache::get("otp:code:{$email}");

        if ($code) {
            $this->line($code);
        } else {
            $this->error('Failed to retrieve OTP');
            return 1;
        }

        return 0;
    }
}

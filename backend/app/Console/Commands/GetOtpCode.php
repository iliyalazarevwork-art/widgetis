<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class GetOtpCode extends Command
{
    protected $signature = 'otp:get {email}';
    protected $description = 'Get current OTP code from cache for given email';

    public function handle(): int
    {
        $email = $this->argument('email');
        $code = Cache::get("otp:code:{$email}");

        if ($code) {
            $this->line($code);
        } else {
            $this->error('No OTP found (expired or not sent)');
            return 1;
        }

        return 0;
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Traits;

use Illuminate\Support\Facades\Log;

trait LogsActivity
{
    /**
     * @param array<string, mixed> $context
     */
    protected function logAuth(string $event, array $context = []): void
    {
        Log::channel('auth')->info($event, array_merge([
            'ip' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ], $context));
    }

    /**
     * @param array<string, mixed> $context
     */
    protected function logPayment(string $event, array $context = []): void
    {
        Log::channel('payments')->info($event, $context);
    }
}

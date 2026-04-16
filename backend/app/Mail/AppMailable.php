<?php

declare(strict_types=1);

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

abstract class AppMailable extends Mailable implements ShouldQueue
{
    use Queueable;
    use SerializesModels;

    protected function cabinetUrl(): string
    {
        $base = rtrim((string) (config('app.frontend_url') ?? config('app.url')), '/');

        return "{$base}/profile";
    }

    protected function renewUrl(): string
    {
        return $this->cabinetUrl() . '/billing';
    }
}

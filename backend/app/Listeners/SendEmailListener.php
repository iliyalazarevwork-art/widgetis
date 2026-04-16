<?php

declare(strict_types=1);

namespace App\Listeners;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Mail;

abstract class SendEmailListener implements ShouldQueue
{
    use InteractsWithQueue;

    public int $tries = 3;

    public string $queue = 'emails';

    /** @return list<int> */
    public function backoff(): array
    {
        return [60, 300, 900];
    }

    final public function handle(object $event): void
    {
        $email = $this->resolveEmail($event);

        if ($email === null || $email === '') {
            return;
        }

        Mail::to($email)->send($this->buildMailable($event));
    }

    abstract protected function resolveEmail(object $event): ?string;

    abstract protected function buildMailable(object $event): Mailable;
}

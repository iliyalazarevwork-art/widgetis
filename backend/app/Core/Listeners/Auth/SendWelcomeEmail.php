<?php

declare(strict_types=1);

namespace App\Core\Listeners\Auth;

use App\Core\Events\Auth\UserRegistered;
use App\Core\Listeners\SendEmailListener;
use App\Core\Mail\Auth\WelcomeMail;
use Illuminate\Mail\Mailable;

final class SendWelcomeEmail extends SendEmailListener
{
    protected function resolveEmail(object $event): ?string
    {
        assert($event instanceof UserRegistered);

        $email = $event->user->email;

        return $email !== '' ? $email : null;
    }

    protected function buildMailable(object $event): Mailable
    {
        assert($event instanceof UserRegistered);

        return new WelcomeMail($event->user);
    }
}

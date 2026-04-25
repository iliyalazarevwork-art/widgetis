<?php

declare(strict_types=1);

namespace App\Core\Mail\Auth;

use App\Core\Mail\AppMailable;
use App\Core\Models\User;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

final class WelcomeMail extends AppMailable
{
    public function __construct(public readonly User $user)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Ласкаво просимо до Widgetis!',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.auth.welcome',
            with: [
                'userName'   => $this->user->name ?? 'друже',
                'cabinetUrl' => $this->cabinetUrl(),
            ],
        );
    }
}

<?php

declare(strict_types=1);

namespace App\Mail\Auth;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WelcomeMail extends Mailable implements ShouldQueue
{
    use Queueable;
    use SerializesModels;

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
        $cabinetUrl = rtrim((string) config('app.frontend_url', config('app.url')), '/') . '/profile';

        return new Content(
            markdown: 'mail.auth.welcome',
            with: [
                'userName'   => $this->user->name ?? 'друже',
                'cabinetUrl' => $cabinetUrl,
            ],
        );
    }
}

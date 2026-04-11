<?php

declare(strict_types=1);

namespace App\Mail\Manager;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LeadRequestMail extends Mailable implements ShouldQueue
{
    use Queueable;
    use SerializesModels;

    public function __construct(
        public readonly string $phone,
        public readonly string $targetType,
        public readonly string $targetId,
        public readonly string $targetLabel,
        public readonly string $createdAt,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '🔔 Нова заявка — ' . $this->targetLabel,
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.manager.lead-request',
            with: [
                'phone' => $this->phone,
                'targetType' => $this->targetType,
                'targetId' => $this->targetId,
                'targetLabel' => $this->targetLabel,
                'createdAt' => $this->createdAt,
            ],
        );
    }
}

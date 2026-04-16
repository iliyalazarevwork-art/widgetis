<?php

declare(strict_types=1);

namespace App\Mail\Billing;

use App\Mail\AppMailable;
use App\Models\Subscription;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Support\Str;

final class SubscriptionCancelledMail extends AppMailable
{
    public function __construct(
        public readonly Subscription $subscription,
        public readonly ?string $reason = null,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Підписку скасовано — Widgetis',
        );
    }

    public function content(): Content
    {
        $plan     = $this->subscription->plan;
        $planName = $plan ? $plan->getTranslation('name', 'uk', false) : '';

        return new Content(
            markdown: 'mail.billing.subscription-cancelled',
            with: [
                'userName'    => $this->subscription->user->name ?? 'друже',
                'planName'    => $planName,
                'reason'      => $this->reason !== null
                    ? Str::limit(strip_tags((string) $this->reason), 255)
                    : null,
                'accessUntil' => $this->subscription->current_period_end->format('d.m.Y'),
            ],
        );
    }
}

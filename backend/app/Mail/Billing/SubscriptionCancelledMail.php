<?php

declare(strict_types=1);

namespace App\Mail\Billing;

use App\Models\Subscription;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SubscriptionCancelledMail extends Mailable implements ShouldQueue
{
    use Queueable;
    use SerializesModels;

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
        $planName = $plan ? ($plan->name['uk'] ?? $plan->name['en'] ?? '') : '';

        return new Content(
            markdown: 'mail.billing.subscription-cancelled',
            with: [
                'userName'      => $this->subscription->user->name ?? 'друже',
                'planName'      => $planName,
                'reason'        => $this->reason,
                'accessUntil'   => $this->subscription->current_period_end->format('d.m.Y'),
            ],
        );
    }
}

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

class SubscriptionTrialStartedMail extends Mailable implements ShouldQueue
{
    use Queueable;
    use SerializesModels;

    public function __construct(public readonly Subscription $subscription)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Пробний період розпочато — Widgetis',
        );
    }

    public function content(): Content
    {
        $plan     = $this->subscription->plan;
        $planName = $plan ? ($plan->name['uk'] ?? $plan->name['en'] ?? '') : '';

        return new Content(
            markdown: 'mail.billing.subscription-trial-started',
            with: [
                'userName'      => $this->subscription->user->name ?? 'друже',
                'planName'      => $planName,
                'trialEndsDate' => $this->subscription->trial_ends_at?->format('d.m.Y') ?? $this->subscription->current_period_end->format('d.m.Y'),
            ],
        );
    }
}

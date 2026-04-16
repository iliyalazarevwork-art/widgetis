<?php

declare(strict_types=1);

namespace App\Mail\Billing;

use App\Mail\AppMailable;
use App\Models\Subscription;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

final class SubscriptionExpiredMail extends AppMailable
{
    public function __construct(public readonly Subscription $subscription)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Термін дії підписки закінчився — Widgetis',
        );
    }

    public function content(): Content
    {
        $plan     = $this->subscription->plan;
        $planName = $plan ? $plan->getTranslation('name', 'uk', false) : '';

        return new Content(
            markdown: 'mail.billing.subscription-expired',
            with: [
                'userName' => $this->subscription->user->name ?? 'друже',
                'planName' => $planName,
                'renewUrl' => $this->renewUrl(),
            ],
        );
    }
}

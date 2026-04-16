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

class SubscriptionExpiredMail extends Mailable implements ShouldQueue
{
    use Queueable;
    use SerializesModels;

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
        $plan       = $this->subscription->plan;
        $planName   = $plan ? ($plan->name['uk'] ?? $plan->name['en'] ?? '') : '';
        $renewUrl   = rtrim((string) config('app.frontend_url', config('app.url')), '/') . '/profile/plan';

        return new Content(
            markdown: 'mail.billing.subscription-expired',
            with: [
                'userName' => $this->subscription->user->name ?? 'друже',
                'planName' => $planName,
                'renewUrl' => $renewUrl,
            ],
        );
    }
}

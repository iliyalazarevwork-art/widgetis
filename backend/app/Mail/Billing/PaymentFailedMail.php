<?php

declare(strict_types=1);

namespace App\Mail\Billing;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PaymentFailedMail extends Mailable implements ShouldQueue
{
    use Queueable;
    use SerializesModels;

    public function __construct(public readonly Order $order)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Не вдалося обробити платіж — Widgetis',
        );
    }

    public function content(): Content
    {
        $cabinetUrl = rtrim((string) config('app.frontend_url', config('app.url')), '/') . '/profile';

        return new Content(
            markdown: 'mail.billing.payment-failed',
            with: [
                'userName'   => $this->order->user->name ?? 'друже',
                'amount'     => $this->order->amount,
                'currency'   => $this->order->currency,
                'cabinetUrl' => $cabinetUrl,
            ],
        );
    }
}

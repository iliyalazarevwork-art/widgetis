<?php

declare(strict_types=1);

namespace App\Mail\Billing;

use App\Mail\AppMailable;
use App\Models\Order;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

final class PaymentFailedMail extends AppMailable
{
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
        return new Content(
            markdown: 'mail.billing.payment-failed',
            with: [
                'userName'   => $this->order->user->name ?? 'друже',
                'amount'     => $this->order->amount,
                'currency'   => $this->order->currency,
                'cabinetUrl' => $this->cabinetUrl(),
            ],
        );
    }
}

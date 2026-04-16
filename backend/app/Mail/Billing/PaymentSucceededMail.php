<?php

declare(strict_types=1);

namespace App\Mail\Billing;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PaymentSucceededMail extends Mailable implements ShouldQueue
{
    use Queueable;
    use SerializesModels;

    public function __construct(
        public readonly Payment $payment,
        public readonly ?Order $order = null,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Оплата успішна — Widgetis',
        );
    }

    public function content(): Content
    {
        $order    = $this->order ?? $this->payment->order;
        $userName = 'друже';

        if ($order !== null && $order->user !== null) {
            $userName = $order->user->name ?? 'друже';
        } elseif ($this->payment->user !== null) {
            $userName = $this->payment->user->name ?? 'друже';
        }

        $amount   = $this->order !== null ? $this->order->amount : $this->payment->amount;
        $currency = $this->order !== null ? $this->order->currency : $this->payment->currency;

        return new Content(
            markdown: 'mail.billing.payment-succeeded',
            with: [
                'userName' => $userName,
                'amount'   => $amount,
                'currency' => $currency,
            ],
        );
    }
}

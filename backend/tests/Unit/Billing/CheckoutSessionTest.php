<?php

declare(strict_types=1);

namespace Tests\Unit\Billing;

use App\Services\Billing\Results\CheckoutSession;
use Tests\TestCase;

final class CheckoutSessionTest extends TestCase
{
    public function test_creates_a_redirect_session_with_get_method(): void
    {
        $session = CheckoutSession::redirect('https://pay.example.com/pay');

        $this->assertSame('GET', $session->method);
        $this->assertSame('https://pay.example.com/pay', $session->url);
        $this->assertSame([], $session->formFields);
        $this->assertNull($session->providerReference);
    }

    public function test_creates_a_redirect_session_with_provider_reference(): void
    {
        $session = CheckoutSession::redirect('https://pay.example.com/pay', 'order-123');
        $this->assertSame('order-123', $session->providerReference);
    }

    public function test_creates_a_post_form_session_with_post_method(): void
    {
        $session = CheckoutSession::postForm('https://pay.example.com/submit', ['field' => 'value']);

        $this->assertSame('POST', $session->method);
        $this->assertSame('https://pay.example.com/submit', $session->url);
        $this->assertSame(['field' => 'value'], $session->formFields);
        $this->assertNull($session->providerReference);
    }

    public function test_creates_a_post_form_session_with_provider_reference(): void
    {
        $session = CheckoutSession::postForm('https://pay.example.com/submit', ['f' => 'v'], 'ref-abc');
        $this->assertSame('ref-abc', $session->providerReference);
    }
}

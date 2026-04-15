<?php

declare(strict_types=1);

namespace Tests\Feature\Mail;

use App\Mail\Auth\OtpMail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * Integration check that the whole OTP email pipeline actually runs:
 * HTTP endpoint → OtpService → Mail queue → OtpMail mailable with the
 * matching code from cache.
 *
 * A gap here (wrong code wired to wrong recipient, lost queue job, missing
 * subject) would silently lock every user out of the product without
 * throwing a single exception, so we pin the shape of the queued mail.
 */
class OtpMailDispatchTest extends TestCase
{
    use RefreshDatabase;

    public function test_send_otp_endpoint_queues_mail_with_the_exact_code_stored_in_cache(): void
    {
        Mail::fake();

        $email = 'integration@example.com';

        $this->postJson('/api/v1/auth/otp', ['email' => $email])
            ->assertStatus(200);

        // The code is random, so the only way to learn it is from cache.
        $storedCode = Cache::get("otp:code:{$email}");
        $this->assertIsString($storedCode);
        $this->assertMatchesRegularExpression('/^\d{6}$/', $storedCode);

        Mail::assertQueued(OtpMail::class, function (OtpMail $mail) use ($email, $storedCode) {
            return $mail->hasTo($email)
                && $mail->code === $storedCode;
        });
    }

    public function test_otp_mail_envelope_has_the_widgetis_subject(): void
    {
        $mail     = new OtpMail('999999', 'fake-magic-token');
        $envelope = $mail->envelope();

        $this->assertStringContainsString('Widgetis', $envelope->subject);
        $this->assertStringContainsString('код', mb_strtolower($envelope->subject));
    }

    public function test_otp_mail_content_passes_the_code_into_the_markdown_view(): void
    {
        $mail    = new OtpMail('424242', 'fake-magic-token');
        $content = $mail->content();

        $this->assertSame('mail.auth.otp', $content->markdown);
        $this->assertArrayHasKey('code', $content->with);
        $this->assertSame('424242', $content->with['code']);
        $this->assertArrayHasKey('magicLink', $content->with);
    }

    public function test_repeated_send_does_not_queue_two_mails_during_cooldown(): void
    {
        Mail::fake();

        $email = 'cooldown-pin@example.com';

        $this->postJson('/api/v1/auth/otp', ['email' => $email])->assertStatus(200);
        $this->postJson('/api/v1/auth/otp', ['email' => $email])->assertStatus(429);

        Mail::assertQueuedCount(1);
    }
}

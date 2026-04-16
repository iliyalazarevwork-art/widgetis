<?php

declare(strict_types=1);

namespace App\Services\Billing\Webhooks;

use App\Exceptions\Billing\MalformedWebhookException;
use Illuminate\Http\Request;

final readonly class InboundWebhook
{
    /**
     * @param array<string, string> $headers
     */
    private function __construct(
        public string $rawBody,
        public array $headers,
        public string $ip,
    ) {
    }

    public static function fromRequest(Request $request): self
    {
        $headers = [];

        foreach ($request->headers->all() as $name => $values) {
            $headers[strtolower($name)] = is_array($values) ? $values[0] : $values;
        }

        return new self(
            rawBody: $request->getContent(),
            headers: $headers,
            ip: $request->ip() ?? '0.0.0.0',
        );
    }

    /**
     * @param array<string, string> $headers
     */
    public static function fromRaw(string $rawBody, array $headers, string $ip): self
    {
        $normalised = [];

        foreach ($headers as $name => $value) {
            $normalised[strtolower($name)] = $value;
        }

        return new self($rawBody, $normalised, $ip);
    }

    /**
     * @return array<string, mixed>
     */
    public function jsonBody(): array
    {
        $decoded = json_decode($this->rawBody, true);

        if (! is_array($decoded)) {
            throw MalformedWebhookException::invalidJson(json_last_error_msg());
        }

        return $decoded;
    }

    public function header(string $name): ?string
    {
        return $this->headers[strtolower($name)] ?? null;
    }
}

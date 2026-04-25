<?php

declare(strict_types=1);

namespace App\Services\Widget\SmsOtp;

use libphonenumber\NumberParseException;
use libphonenumber\PhoneNumberFormat;
use libphonenumber\PhoneNumberUtil;

final class PhoneNormalizer
{
    private const DEFAULT_REGION = 'UA';

    public function normalize(string $phone): string
    {
        $util = PhoneNumberUtil::getInstance();

        try {
            $parsed = $util->parse($phone, self::DEFAULT_REGION);
        } catch (NumberParseException $e) {
            throw new \InvalidArgumentException('Invalid phone number: ' . $e->getMessage(), previous: $e);
        }

        if (! $util->isValidNumber($parsed)) {
            throw new \InvalidArgumentException('Invalid phone number: validation failed');
        }

        return $util->format($parsed, PhoneNumberFormat::E164);
    }

    public function mask(string $e164Phone): string
    {
        $len = strlen($e164Phone);

        if ($len < 7) {
            return '****';
        }

        // Keep country code + first 4 digits, mask the middle, keep last 3
        $prefix = substr($e164Phone, 0, $len - 7);
        $suffix = substr($e164Phone, -3);

        return $prefix . '****' . $suffix;
    }
}

<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Models\Site;
use PHPUnit\Framework\TestCase;

class SiteDomainNormalizationTest extends TestCase
{
    public function test_it_normalizes_www_and_case(): void
    {
        $domain = Site::domainFromUrl('https://WWW.Example.COM/catalog');

        $this->assertSame('example.com', $domain);
    }

    public function test_it_trims_trailing_dot(): void
    {
        $domain = Site::domainFromUrl('https://example.com./');

        $this->assertSame('example.com', $domain);
    }
}

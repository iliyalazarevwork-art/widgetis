<?php

declare(strict_types=1);

namespace Tests\Feature\Recommender;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use OpenAI\Contracts\ClientContract;
use Tests\TestCase;

final class InfrastructureTest extends TestCase
{
    use RefreshDatabase;

    public function test_pgvector_extension_is_installed(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            self::markTestSkipped('pgvector extension is only checked against the postgres driver');
        }

        $row = DB::selectOne("SELECT extname, extversion FROM pg_extension WHERE extname = 'vector'");

        self::assertNotNull($row, 'pgvector extension must be installed');
        self::assertSame('vector', $row->extname);
    }

    public function test_recommender_config_is_loaded(): void
    {
        self::assertSame('text-embedding-3-small', config('recommender.models.embedding'));
        self::assertSame(1536, config('recommender.embedding.dimensions'));
        self::assertGreaterThan(0, config('recommender.composer.top_n'));
    }

    public function test_vertical_dictionaries_load(): void
    {
        $bedding = require config_path('recommender/verticals/bedding.php');
        $generic = require config_path('recommender/verticals/generic.php');

        self::assertSame('bedding', $bedding['name']);
        self::assertSame('generic', $generic['name']);
        self::assertArrayHasKey('primary_type', $bedding['fields']);
        self::assertArrayHasKey('color_family', $bedding['fields']);
    }

    public function test_openai_client_resolves_from_container(): void
    {
        $client = app(ClientContract::class);

        self::assertNotNull($client);
    }
}

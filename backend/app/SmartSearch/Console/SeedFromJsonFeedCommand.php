<?php

declare(strict_types=1);

namespace App\SmartSearch\Console;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * One-off seeder for local development: imports a LoyalShop-format JSON feed
 * into our smart-search tables so we can test search quality without a real YML feed.
 *
 * Usage:
 *   docker compose -f docker-compose.dev.yml exec backend php artisan smart-search:seed-from-json /app/loyalshop-feed.json
 */
final class SeedFromJsonFeedCommand extends Command
{
    protected $signature = 'smart-search:seed-from-json
        {file           : Absolute path to the LoyalShop JSON feed file inside the container}
        {--domain=www.safeyourlove.com : Site domain to use for the test import}
        {--lang=uk      : Language code (uk / ru / en)}
        {--limit=0      : Max products to import (0 = all)}
        {--truncate     : Delete existing products for this site+lang before importing}';

    protected $description = 'Import a LoyalShop JSON feed into the local smart-search index (dev/testing only)';

    private const BATCH_SIZE = 500;

    public function handle(): int
    {
        $file   = (string) $this->argument('file');
        $domain = (string) $this->option('domain');
        $lang   = (string) $this->option('lang');
        $limit  = (int) $this->option('limit');

        if (! file_exists($file)) {
            $this->error("File not found: {$file}");

            return self::FAILURE;
        }

        $this->info("Reading {$file} …");
        /** @var array<string, mixed> $feed */
        $feed = json_decode((string) file_get_contents($file), true, 512, JSON_THROW_ON_ERROR);

        /** @var list<array<string, mixed>> $products */
        $products = $feed['products'] ?? [];

        if ($limit > 0) {
            $products = array_slice($products, 0, $limit);
        }

        $total = count($products);
        $this->info("Products to import: {$total}");

        // ── Resolve site ────────────────────────────────────────────────────────

        $site = DB::connection('pgsql_runtime')
            ->table('wgt_sites')
            ->where('domain', $domain)
            ->first();

        if ($site === null) {
            $user = DB::table('users')->first();
            if ($user === null) {
                $this->error('No users found in DB. Create a user first.');

                return self::FAILURE;
            }

            $siteId = Str::uuid7()->toString();
            DB::connection('pgsql_runtime')->table('wgt_sites')->insert([
                'id'              => $siteId,
                'user_id'         => $user->id,
                'site_key'        => Str::uuid7()->toString(),
                'name'            => $domain,
                'domain'          => $domain,
                'url'             => "https://{$domain}",
                'allowed_origins' => json_encode(["https://{$domain}"]),
                'platform'        => 'horoshop',
                'status'          => 'active',
                'script_installed' => false,
                'created_at'      => now(),
                'updated_at'      => now(),
            ]);

            $this->info("Created test site: {$domain} ({$siteId})");
        } else {
            $siteId = (string) $site->id;
            $this->info("Using existing site: {$domain} ({$siteId})");
        }

        // ── Optional truncate ───────────────────────────────────────────────────

        if ($this->option('truncate')) {
            $deleted = DB::connection('pgsql_runtime')
                ->table('wgt_smart_search_products')
                ->where('site_id', $siteId)
                ->where('lang', $lang)
                ->delete();
            $this->info("Deleted {$deleted} existing products.");
        }

        // ── Import category URLs ─────────────────────────────────────────────────

        /** @var array<string, string> $categoryUrls */
        $categoryUrls = $feed['categoryUrls'] ?? [];
        foreach ($categoryUrls as $catName => $catUrl) {
            DB::connection('pgsql_runtime')
                ->table('wgt_smart_search_categories')
                ->upsert(
                    [
                        'id'          => Str::uuid7()->toString(),
                        'site_id'     => $siteId,
                        'lang'        => $lang,
                        'external_id' => Str::slug($catName),
                        'parent_id'   => null,
                        'name'        => $catName,
                        'url'         => $catUrl,
                        'updated_at'  => now(),
                        'created_at'  => now(),
                    ],
                    ['site_id', 'lang', 'external_id'],
                    ['name', 'url', 'updated_at'],
                );
        }
        $this->info('Category URLs imported: ' . count($categoryUrls));

        // ── Import products in batches ─────────────────────────────────────────

        $bar     = $this->output->createProgressBar($total);
        $batch   = [];
        $imported = 0;

        $langKey = match ($lang) {
            'ru'    => 'ru',
            'en'    => 'en',
            'pl'    => 'pl',
            default => 'ua',
        };

        foreach ($products as $p) {
            /** @var array<string, mixed> $p */
            $names = $p['names'] ?? [];

            $name      = (string) (($names[$langKey] ?? null) ?: ($p['name'] ?? ''));
            $catName   = (string) ($p['rootCategoryName'] ?? 'Інше');
            $catPath   = (string) ($p['categoryName'] ?? $catName);
            $vendor    = (string) ($p['vendor'] ?? '');

            $searchText = mb_strtolower(
                trim(implode(' ', array_filter([
                    $name,
                    $vendor,
                    $catPath,
                ])))
            );

            $batch[] = [
                'id'            => Str::uuid7()->toString(),
                'site_id'       => $siteId,
                'lang'          => $lang,
                'external_id'   => (string) ($p['id'] ?? Str::uuid7()->toString()),
                'name'          => mb_substr($name, 0, 1000),
                'vendor'        => $vendor !== '' ? mb_substr($vendor, 0, 255) : null,
                'category_id'   => Str::slug($catName),
                'category_path' => mb_substr($catPath, 0, 1000),
                'category_name' => mb_substr($catName, 0, 1000),
                'picture'       => mb_substr((string) ($p['picture'] ?? ''), 0, 2000) ?: null,
                'url'           => mb_substr((string) ($p['url'] ?? ''), 0, 2000),
                'price'         => (int) ($p['price'] ?? 0),
                'oldprice'      => (int) ($p['oldprice'] ?? 0),
                'currency'      => 'UAH',
                'available'     => (bool) ($p['available'] ?? true),
                'search_text'   => $searchText,
                'popularity'    => 0,
                'created_at'    => now(),
                'updated_at'    => now(),
            ];

            if (count($batch) >= self::BATCH_SIZE) {
                $this->flushBatch($batch);
                $imported += count($batch);
                $bar->advance(count($batch));
                $batch = [];
            }
        }

        if ($batch !== []) {
            $this->flushBatch($batch);
            $imported += count($batch);
            $bar->advance(count($batch));
        }

        $bar->finish();
        $this->newLine();
        $this->info("Done. Imported {$imported} products.");
        $this->info("Site ID: {$siteId}");
        $this->info('Test with:');
        $this->line("  curl 'http://localhost/api/v1/widgets/smart-search?q=вібратор&limit=4&lang=uk' -H 'Origin: https://{$domain}'");

        return self::SUCCESS;
    }

    /** @param list<array<string, mixed>> $batch */
    private function flushBatch(array $batch): void
    {
        DB::connection('pgsql_runtime')
            ->table('wgt_smart_search_products')
            ->upsert(
                $batch,
                ['site_id', 'lang', 'external_id'],
                [
                    'name', 'vendor', 'category_id', 'category_path', 'category_name',
                    'picture', 'url', 'price', 'oldprice', 'currency', 'available',
                    'search_text', 'updated_at',
                ],
            );
    }
}

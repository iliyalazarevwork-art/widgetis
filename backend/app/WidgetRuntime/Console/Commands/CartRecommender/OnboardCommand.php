<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Console\Commands\CartRecommender;

use App\WidgetRuntime\Enums\CatalogVertical;
use App\WidgetRuntime\Models\CatalogProduct;
use App\WidgetRuntime\Models\Site;
use App\WidgetRuntime\Services\Catalog\Exceptions\SiteNotFoundException;
use Illuminate\Console\Command;

final class OnboardCommand extends Command
{
    protected $signature = 'cart-recommender:onboard
                            {site : Domain or site_key}
                            {--vertical=generic : bedding|generic, sets sites.recommender_vertical}
                            {--xlsx= : path to xlsx (catalog source). If omitted, uses cartum.}
                            {--limit= : tag/embed only first N products (debug)}
                            {--sync : run tagging+embedding synchronously instead of dispatching}';

    protected $description = 'End-to-end onboard: import catalog → AI-tag → embed.';

    public function handle(): int
    {
        $siteArg  = (string) $this->argument('site');
        $vertical = CatalogVertical::tryFrom((string) $this->option('vertical'));

        if ($vertical === null) {
            $this->error(
                sprintf(
                    'Invalid vertical "%s". Allowed: %s',
                    $this->option('vertical'),
                    implode(', ', array_column(CatalogVertical::cases(), 'value')),
                ),
            );

            return self::FAILURE;
        }

        // ── Phase 1: resolve site ──────────────────────────────────────
        $this->info('Phase 1: Resolving site…');

        $site = Site::query()->where('domain', $siteArg)->first()
            ?? Site::query()->where('site_key', $siteArg)->first();

        if ($site === null) {
            throw new SiteNotFoundException("Site not found: {$siteArg}");
        }

        $this->info("  Site resolved: {$site->domain} (id={$site->getKey()})");

        // ── Phase 2: persist vertical ──────────────────────────────────
        $this->info('Phase 2: Persisting vertical…');

        $site->update(['recommender_vertical' => $vertical]);

        $this->info("  recommender_vertical set to [{$vertical->value}]");

        // ── Phase 3: import catalog ────────────────────────────────────
        $this->info('Phase 3: Importing catalog…');

        if ($this->option('xlsx') === null) {
            $this->error('Cartum import not yet implemented. Pass --xlsx=/path/to/file.xlsx');

            return self::FAILURE;
        }

        $importResult = $this->call('catalog:import-xlsx', [
            'site' => $siteArg,
            'path' => $this->option('xlsx'),
        ]);

        if ($importResult !== self::SUCCESS) {
            $this->error('Import failed. Aborting.');

            return self::FAILURE;
        }

        $this->info('  Import finished.');

        // ── Phase 4: AI-tag ────────────────────────────────────────────
        $this->info('Phase 4: Tagging products with AI…');

        $tagArgs = ['site' => $siteArg];

        if ($this->option('limit') !== null) {
            $tagArgs['--limit'] = $this->option('limit');
        }

        if ($this->option('sync')) {
            $tagArgs['--sync'] = true;
        }

        $tagResult = $this->call('catalog:tag', $tagArgs);

        if ($tagResult !== self::SUCCESS) {
            $this->error('Tagging failed. Aborting.');

            return self::FAILURE;
        }

        $this->info('  Tagging finished.');

        // ── Phase 5: embed ─────────────────────────────────────────────
        $this->info('Phase 5: Embedding products…');

        $embedArgs = ['site' => $siteArg];

        if ($this->option('limit') !== null) {
            $embedArgs['--limit'] = $this->option('limit');
        }

        if ($this->option('sync')) {
            $embedArgs['--sync'] = true;
        }

        $embedResult = $this->call('catalog:embed', $embedArgs);

        if ($embedResult !== self::SUCCESS) {
            $this->error('Embedding failed. Aborting.');

            return self::FAILURE;
        }

        $this->info('  Embedding finished.');

        // ── Phase 6: summary ───────────────────────────────────────────
        $this->info('Phase 6: Summary');

        $siteId = $site->getKey();

        $total    = CatalogProduct::query()->where('site_id', $siteId)->count();
        $tagged   = CatalogProduct::query()->where('site_id', $siteId)->whereNotNull('ai_tagged_at')->count();
        $embedded = CatalogProduct::query()->where('site_id', $siteId)->whereNotNull('embedded_at')->count();

        $this->table(
            ['Metric', 'Count'],
            [
                ['Products total', $total],
                ['AI-tagged',      $tagged],
                ['Embedded',       $embedded],
            ],
        );

        $this->info('Onboarding complete.');

        return self::SUCCESS;
    }
}

<?php

namespace App\Console\Commands;

use App\Modules\OnePlusOne\Models\HoroshopProduct;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use PhpOffice\PhpSpreadsheet\IOFactory;

class ScrapeProductIds extends Command
{
    protected $signature = 'scrape:product-ids
        {site       : Домен сайта, например benihome.uk}
        {file       : Путь к xlsx-файлу выгрузки}
        {--start=0  : С какой строки начать (0-based)}
        {--limit=10 : Сколько строк обработать (0 = все)}
        {--delay=500: Задержка между запросами, мс}';

    protected $description = 'Парсит product_id товаров с сайта через конфигуратор-прокси и сохраняет в horoshop_products';

    public function handle(): int
    {
        $site = $this->argument('site');
        $file = $this->argument('file');
        $start = (int) $this->option('start');
        $limit = (int) $this->option('limit');
        $delay = (int) $this->option('delay');

        // Базовый URL конфигуратора: внутренний сервис → нет внешних зависимостей
        $proxyBase = rtrim(config('services.configurator.iframe_url'), '/');

        if (! file_exists($file)) {
            $this->error("Файл не найден: {$file}");

            return self::FAILURE;
        }

        $rows = $this->loadRows($file);

        if (empty($rows)) {
            $this->error('В файле не найдены колонки Артикул / Алиас');

            return self::FAILURE;
        }

        $chunk = $limit > 0
            ? array_slice($rows, $start, $limit)
            : array_slice($rows, $start);

        $this->info(sprintf(
            'Сайт: %s | Строки %d–%d (всего в файле: %d)',
            $site,
            $start,
            $start + count($chunk) - 1,
            count($rows)
        ));

        $bar = $this->output->createProgressBar(count($chunk));
        $bar->start();

        $saved = 0;
        $failed = 0;

        foreach ($chunk as $i => ['article' => $article, 'alias' => $alias]) {
            $productId = $this->fetchProductId($proxyBase, $site, $alias);

            if ($productId !== null) {
                HoroshopProduct::updateOrCreate(
                    ['site' => $site, 'article' => $article],
                    ['horoshop_id' => $productId]
                );
                $saved++;
            } else {
                $this->newLine();
                $this->warn("  NOT FOUND: {$article} → {$alias}");
                $failed++;
            }

            $bar->advance();

            if ($i < count($chunk) - 1 && $delay > 0) {
                usleep($delay * 1000);
            }
        }

        $bar->finish();
        $this->newLine();
        $this->info("Готово. Сохранено: {$saved}, не найдено: {$failed}");

        return self::SUCCESS;
    }

    /**
     * Читает xlsx-файл, ищет колонки "артикул" и "алиас" (регистронезависимо).
     *
     * @return array<int, array{article: string, alias: string}>
     */
    private function loadRows(string $path): array
    {
        $spreadsheet = IOFactory::load($path);
        $sheet = $spreadsheet->getActiveSheet();
        $data = $sheet->toArray();

        if (empty($data)) {
            return [];
        }

        // Определяем индексы колонок по заголовку
        $headers = array_map(fn ($h) => mb_strtolower(trim((string) $h)), $data[0]);

        $articleCol = $this->findColumn($headers, ['артикул', 'article', 'sku']);
        $aliasCol = $this->findColumn($headers, ['алиас', 'alias', 'slug', 'url']);

        if ($articleCol === null || $aliasCol === null) {
            return [];
        }

        $rows = [];
        foreach (array_slice($data, 1) as $row) {
            $article = trim((string) ($row[$articleCol] ?? ''));
            $alias = trim((string) ($row[$aliasCol] ?? ''));
            if ($article !== '' && $alias !== '') {
                $rows[] = ['article' => $article, 'alias' => $alias];
            }
        }

        return $rows;
    }

    private function findColumn(array $headers, array $candidates): ?int
    {
        foreach ($candidates as $name) {
            $idx = array_search($name, $headers, true);
            if ($idx !== false) {
                return (int) $idx;
            }
        }

        return null;
    }

    /**
     * Загружает страницу товара через конфигуратор-прокси и извлекает product_id.
     */
    private function fetchProductId(string $proxyBase, string $domain, string $alias): ?int
    {
        $url = "{$proxyBase}/site/{$domain}/{$alias}/";

        try {
            $response = Http::timeout(15)->get($url);
        } catch (\Throwable $e) {
            $this->newLine();
            $this->error("  HTTP error for {$alias}: {$e->getMessage()}");

            return null;
        }

        if (! $response->successful()) {
            return null;
        }

        // <div id="j-buy-button-counter-516" ...> или id="j-buy-button-widget-516"
        if (preg_match('/id="j-buy-button-(?:counter|widget)-(\d+)"/', $response->body(), $m)) {
            return (int) $m[1];
        }

        return null;
    }
}

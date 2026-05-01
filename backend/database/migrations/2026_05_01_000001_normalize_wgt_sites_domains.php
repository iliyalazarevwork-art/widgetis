<?php

declare(strict_types=1);

use App\WidgetRuntime\Models\Site;
use Illuminate\Database\Connection;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        $connection = DB::connection('pgsql_runtime');

        if (! Schema::connection('pgsql_runtime')->hasTable('wgt_sites')) {
            return;
        }

        $rows = $connection->table('wgt_sites')
            ->select('id', 'user_id', 'domain', 'created_at')
            ->orderBy('created_at')
            ->orderBy('id')
            ->get();

        $groups = [];
        foreach ($rows as $row) {
            $normalized = Site::domainFromUrl((string) $row->domain);

            if ($normalized === '') {
                Log::warning('NormalizeWgtSitesDomains: skipping site with empty normalized domain.', [
                    'site_id' => $row->id,
                    'raw_domain' => $row->domain,
                ]);
                continue;
            }

            $key = $row->user_id . '|' . $normalized;
            $groups[$key][] = ['row' => $row, 'normalized' => $normalized];
        }

        $childTables = $this->fetchChildTables($connection);

        $connection->transaction(function () use ($connection, $groups, $childTables): void {
            foreach ($groups as $entries) {
                $winner = $entries[0];
                $winnerId = $winner['row']->id;
                $winnerNormalized = $winner['normalized'];

                foreach (array_slice($entries, 1) as $loser) {
                    $this->mergeLoserIntoWinner(
                        $connection,
                        (string) $loser['row']->id,
                        (string) $winnerId,
                        $childTables,
                    );
                }

                if ($winner['row']->domain !== $winnerNormalized) {
                    $connection->table('wgt_sites')
                        ->where('id', $winnerId)
                        ->update(['domain' => $winnerNormalized]);
                }
            }
        });
    }

    public function down(): void
    {
        // Domain normalization is irreversible without retaining the original raw values.
    }

    /**
     * @return list<array{table:string,column:string}>
     */
    private function fetchChildTables(Connection $connection): array
    {
        $rows = $connection->select(<<<'SQL'
            SELECT tc.table_name AS table_name, kcu.column_name AS column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
             AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage ccu
              ON tc.constraint_name = ccu.constraint_name
             AND tc.table_schema = ccu.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY'
              AND ccu.table_name = 'wgt_sites'
              AND ccu.column_name = 'id'
              AND tc.table_name <> 'wgt_sites'
        SQL);

        return array_map(
            static fn ($row): array => [
                'table' => (string) $row->table_name,
                'column' => (string) $row->column_name,
            ],
            $rows,
        );
    }

    /**
     * @param list<array{table:string,column:string}> $childTables
     */
    private function mergeLoserIntoWinner(
        Connection $connection,
        string $loserId,
        string $winnerId,
        array $childTables,
    ): void {
        foreach ($childTables as $child) {
            $table = $child['table'];
            $column = $child['column'];

            if (! $connection->table($table)->where($column, $loserId)->exists()) {
                continue;
            }

            if ($table === 'wgt_site_scripts') {
                $winnerHasScript = $connection->table($table)->where($column, $winnerId)->exists();

                if ($winnerHasScript) {
                    $connection->table($table)->where($column, $loserId)->delete();
                } else {
                    $connection->table($table)->where($column, $loserId)->update([$column => $winnerId]);
                }

                continue;
            }

            try {
                $connection->table($table)->where($column, $loserId)->update([$column => $winnerId]);
            } catch (\Throwable $e) {
                throw new RuntimeException(sprintf(
                    'NormalizeWgtSitesDomains: cannot merge site %s into %s — conflict in %s.%s: %s',
                    $loserId,
                    $winnerId,
                    $table,
                    $column,
                    $e->getMessage(),
                ), 0, $e);
            }
        }

        Log::info('NormalizeWgtSitesDomains: merged duplicate site.', [
            'loser_site_id' => $loserId,
            'winner_site_id' => $winnerId,
        ]);

        $connection->table('wgt_sites')->where('id', $loserId)->delete();
    }
};

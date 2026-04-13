<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Enforces idempotency on successful payment webhooks at the DB level.
 *
 * Providers (both LiqPay and Monobank) retry success webhooks on
 * timeout/error. The application-level `Payment::where(transaction_id,
 * status=success)` check is racy under concurrent delivery: two
 * simultaneous webhooks can both see no existing row and both insert,
 * creating duplicate Payment rows and double-advancing subscription
 * periods.
 *
 * A unique partial index on (transaction_id) WHERE status='success'
 * gives the second INSERT a hard DB-level failure which Laravel
 * surfaces as QueryException; the webhook handler's outer transaction
 * rolls back cleanly.
 *
 * Partial (filtered) so that failed/pending payments can still reuse
 * the same transaction_id across retries without tripping the index.
 */
return new class () extends Migration {
    public function up(): void
    {
        DB::statement(<<<'SQL'
            CREATE UNIQUE INDEX IF NOT EXISTS payments_success_transaction_id_unique
            ON payments (transaction_id)
            WHERE transaction_id IS NOT NULL AND status = 'success'
        SQL);
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS payments_success_transaction_id_unique');
    }
};

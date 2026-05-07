<?php

declare(strict_types=1);

namespace App\Core\Services\Plan;

use App\Core\Models\User;
use App\Exceptions\Plan\AlreadyFoundingException;
use App\Exceptions\Plan\FoundingSlotsExhaustedException;
use Illuminate\Support\Facades\DB;

final class FoundingService
{
    public function __construct(
        private readonly int $maxSlots,
        private readonly int $proLockedPriceMonthly,
    ) {
    }

    /**
     * How many founding slots remain.
     */
    public function remainingSlots(): int
    {
        $claimed = DB::table('users')->where('is_founding', true)->count();

        return max(0, $this->maxSlots - $claimed);
    }

    /**
     * True if at least one slot is left.
     */
    public function isAvailable(): bool
    {
        return $this->remainingSlots() > 0;
    }

    /**
     * Atomically claim a founding slot for the user.
     *
     * Sets is_founding=true and founding_locked_price_monthly from config.
     * Wrapped in a transaction with SELECT FOR UPDATE to prevent race conditions.
     *
     * @throws AlreadyFoundingException
     * @throws FoundingSlotsExhaustedException
     */
    public function claimSlot(User $user): void
    {
        DB::transaction(function () use ($user): void {
            // Lock the user row and re-read is_founding inside the transaction
            $fresh = DB::table('users')
                ->where('id', $user->id)
                ->lockForUpdate()
                ->first(['id', 'is_founding']);

            if ($fresh !== null && $fresh->is_founding) {
                throw AlreadyFoundingException::create();
            }

            // Count claimed slots with FOR UPDATE to block concurrent claims
            $claimed = DB::table('users')
                ->where('is_founding', true)
                ->lockForUpdate()
                ->count();

            if ($claimed >= $this->maxSlots) {
                throw FoundingSlotsExhaustedException::create();
            }

            DB::table('users')
                ->where('id', $user->id)
                ->update([
                    'is_founding' => true,
                    'founding_locked_price_monthly' => $this->proLockedPriceMonthly,
                    'updated_at' => now(),
                ]);
        });
    }

    /**
     * Total slots constant from config.
     */
    public function totalSlots(): int
    {
        return $this->maxSlots;
    }

    /**
     * Locked price constant from config.
     */
    public function lockedPriceMonthly(): int
    {
        return $this->proLockedPriceMonthly;
    }
}

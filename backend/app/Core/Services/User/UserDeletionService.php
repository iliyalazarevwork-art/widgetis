<?php

declare(strict_types=1);

namespace App\Core\Services\User;

use App\Core\Models\ActivityLog;
use App\Core\Models\ManagerRequest;
use App\Core\Models\Order;
use App\Core\Models\Payment;
use App\Core\Models\User;
use App\Shared\Events\User\Deleted;
use App\Shared\ValueObjects\UserId;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class UserDeletionService
{
    /**
     * Permanently delete a user account and all related domain data.
     *
     * Runtime data (sites, reviews, widget grants, demo sessions, OTP records)
     * is handled by the PurgeSitesOnUserDeleted listener via the Deleted event.
     */
    public function delete(User $user): void
    {
        $userId = $user->id;
        $email = $user->email;

        // Dispatch runtime purge event before deleting the user row so listeners
        // can still resolve the user if needed.
        event(new Deleted(UserId::fromString((string) $userId)));

        DB::transaction(function () use ($user): void {
            Payment::where('user_id', $user->id)->delete();
            Order::where('user_id', $user->id)->delete();
            ManagerRequest::where('user_id', $user->id)->forceDelete();
            ActivityLog::where('user_id', $user->id)->delete();

            $user->delete();
        });

        Log::info('UserDeletionService: user permanently deleted.', [
            'user_id' => $userId,
            'email' => $email,
        ]);
    }
}

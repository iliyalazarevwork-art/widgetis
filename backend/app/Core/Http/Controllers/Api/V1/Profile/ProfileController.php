<?php

declare(strict_types=1);

namespace App\Core\Http\Controllers\Api\V1\Profile;

use App\Core\Http\Controllers\Api\V1\CoreBaseController;
use App\Core\Models\ManagerRequest;
use App\Core\Models\Product;
use App\Core\Services\User\UserDeletionService;
use App\Shared\Contracts\SiteOwnershipInterface;
use App\Shared\Contracts\WidgetRuntimeStatsInterface;
use App\Shared\ValueObjects\SiteId;
use App\Shared\ValueObjects\UserId;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProfileController extends CoreBaseController
{
    public function __construct(
        private readonly SiteOwnershipInterface $siteOwnership,
        private readonly WidgetRuntimeStatsInterface $runtimeStats,
    ) {
    }

    public function show(): JsonResponse
    {
        $user = $this->currentUser();

        return $this->success([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'telegram' => $user->telegram,
                'company' => $user->company,
                'avatar_url' => $user->avatar_url,
                'locale' => $user->locale,
                'two_factor_enabled' => $user->two_factor_enabled,
                'two_factor_method' => $user->two_factor_method,
                'notification_enabled' => $user->notification_enabled,
                'onboarding_completed' => $user->onboarding_completed_at !== null,
                'created_at' => $user->created_at->toIso8601String(),
            ],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $this->currentUser();

        $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['sometimes', 'nullable', 'regex:/^\+380\d{9}$/'],
            'telegram' => ['sometimes', 'nullable', 'string', 'max:100'],
            'company' => ['sometimes', 'nullable', 'string', 'max:255'],
            'locale' => ['sometimes', 'string', 'in:uk,en'],
        ]);

        $user->update($request->only(['name', 'email', 'phone', 'telegram', 'company', 'locale']));

        return $this->show();
    }

    public function destroy(UserDeletionService $userDeletionService): JsonResponse
    {
        $user = $this->currentUser();

        auth('core')->logout();

        $userDeletionService->delete($user);

        return $this->noContent();
    }

    public function completeOnboarding(): JsonResponse
    {
        $this->currentUser()->update(['onboarding_completed_at' => now()]);

        return $this->noContent();
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $request->validate([
            'notification_enabled' => ['sometimes', 'boolean'],
            'locale' => ['sometimes', 'string', 'in:uk,en'],
        ]);

        $user = $this->currentUser();
        $user->update($request->only(['notification_enabled', 'locale']));

        return $this->success([
            'data' => [
                'notification_enabled' => $user->notification_enabled,
                'locale' => $user->locale,
            ],
        ]);
    }

    public function widgets(): JsonResponse
    {
        $user = $this->currentUser();
        $plan = $user->currentPlan();
        $availableProductIds = $plan?->products()->pluck('products.id')->toArray() ?? [];
        $allProducts = Product::active()->with('tag')->orderBy('sort_order')->get();
        $userId = UserId::fromString((string) $user->id);
        $activeSiteWidgets = $this->runtimeStats->activeSiteWidgets();

        $available = [];
        $locked = [];

        foreach ($allProducts as $product) {
            if (in_array($product->id, $availableProductIds)) {
                $available[] = [
                    'product_id' => $product->id,
                    'slug' => $product->slug,
                    'name' => $product->translated('name'),
                    'icon' => $product->icon,
                ];
            } else {
                $locked[] = [
                    'product_id' => $product->id,
                    'slug' => $product->slug,
                    'name' => $product->translated('name'),
                    'icon' => $product->icon,
                ];
            }
        }

        return $this->success([
            'available' => $available,
            'locked' => $locked,
            'limits' => [
                'used' => $this->runtimeStats->sitesForUser($userId),
                'max' => $plan?->max_widgets ?? 2,
            ],
        ]);
    }

    public function payments(Request $request): JsonResponse
    {
        $user = $this->currentUser();
        $payments = $user->payments()->orderByDesc('created_at')
            ->paginate(min((int) $request->input('per_page', 20), 50));

        return $this->paginated($payments, [
            'data' => collect($payments->items())->map(fn ($p) => [
                'id' => $p->id,
                'type' => $p->type,
                'amount' => (float) $p->amount,
                'currency' => $p->currency,
                'status' => $p->status,
                'created_at' => $p->created_at->toIso8601String(),
            ]),
        ]);
    }

    public function createSupportRequest(Request $request): JsonResponse
    {
        $request->validate([
            'type' => ['required', 'string', 'in:install_help,general'],
            'site_id' => ['nullable', 'string'],
            'messenger' => ['nullable', 'string', 'in:telegram,viber,whatsapp'],
            'phone' => ['required_if:type,install_help', 'nullable', 'string', 'max:20'],
            'name' => ['nullable', 'string', 'max:100'],
            'message' => ['nullable', 'string', 'max:2000'],
        ]);

        $user = $this->currentUser();
        $siteId = $request->input('site_id');

        // Verify site ownership without importing WidgetRuntime models
        if ($siteId !== null) {
            $userId = UserId::fromString((string) $user->id);
            $siteIdVO = SiteId::fromString((string) $siteId);

            if (! $this->siteOwnership->userOwnsSite($userId, $siteIdVO)) {
                return $this->error('SITE_NOT_FOUND', 'Site not found or not owned by user.', 422);
            }
        }

        $mr = ManagerRequest::create([
            'user_id' => $user->id,
            'site_id' => $siteId,
            'type' => $request->input('type'),
            'messenger' => $request->input('messenger'),
            'email' => $user->email,
            'name' => $request->input('name'),
            'phone' => $request->input('phone'),
            'message' => $request->input('message'),
            'status' => 'new',
        ]);

        return $this->created(['data' => ['id' => $mr->id, 'status' => $mr->status]]);
    }
}

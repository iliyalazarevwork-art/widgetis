<?php

declare(strict_types=1);

namespace App\Core\Http\Controllers\Api\V1\Public;

use App\Core\Http\Controllers\Api\V1\CoreBaseController;
use App\Core\Http\Requests\Api\V1\Public\StoreLeadRequest;
use App\Core\Mail\Manager\LeadRequestMail;
use App\Core\Models\ManagerRequest;
use App\Core\Models\Plan;
use App\Core\Models\Product;
use App\Enums\ManagerRequestType;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class LeadRequestController extends CoreBaseController
{
    public function store(StoreLeadRequest $request): JsonResponse
    {
        $data = $request->validated();
        /** @var string $type */
        $type = $data['type'];
        /** @var string $targetId */
        $targetId = $data['target_id'];
        /** @var string $phone */
        $phone = $data['phone'];

        [$targetLabel, $targetFound] = $this->resolveTargetLabel($type, $targetId);

        $mr = ManagerRequest::create([
            'type' => ManagerRequestType::PlanInterest->value,
            'phone' => $phone,
            'widgets' => [
                'interest_type' => $type,
                'interest_target' => $targetId,
                'interest_label' => $targetLabel,
            ],
            'status' => 'new',
        ]);

        $adminEmail = config('app.admin_email');
        if (is_string($adminEmail) && $adminEmail !== '') {
            Mail::to($adminEmail)->queue(new LeadRequestMail(
                phone: $phone,
                targetType: $type,
                targetId: $targetId,
                targetLabel: $targetLabel,
                createdAt: $mr->created_at?->toDateTimeString() ?? now()->toDateTimeString(),
            ));
        }

        Log::info('lead_request.created', [
            'id' => $mr->id,
            'type' => $type,
            'target' => $targetId,
            'target_found' => $targetFound,
        ]);

        return $this->created(['data' => ['id' => $mr->id]]);
    }

    /**
     * @return array{0: string, 1: bool}
     */
    private function resolveTargetLabel(string $type, string $targetId): array
    {
        if ($type === 'plan') {
            $plan = Plan::where('slug', $targetId)->first();
            if ($plan !== null) {
                $name = $plan->translated('name');

                return [is_string($name) && $name !== '' ? $name : ucfirst($targetId), true];
            }

            return [ucfirst($targetId) . ' plan', false];
        }

        if ($type === 'widget') {
            $product = Product::where('slug', $targetId)->first();
            if ($product !== null) {
                $name = $product->translated('name');

                return [is_string($name) && $name !== '' ? $name : $targetId, true];
            }

            return [$targetId, false];
        }

        return [$targetId, false];
    }
}

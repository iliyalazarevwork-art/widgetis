<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Enums\SubscriptionStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Requests\Api\V1\Auth\SendOtpRequest;
use App\Http\Traits\LogsActivity;
use App\Models\User;
use App\Services\Auth\OtpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Tymon\JWTAuth\JWTGuard;

class AuthController extends BaseController
{
    use LogsActivity;
    public function __construct(
        private readonly OtpService $otpService,
    ) {
    }

    public function sendOtp(SendOtpRequest $request): JsonResponse
    {
        $this->otpService->send($request->validated('email'));
        $this->logAuth('otp.sent', ['email' => $request->validated('email')]);

        return $this->success(['message' => 'OTP sent', 'expires_in' => 600]);
    }

    public function verifyOtp(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'code' => ['required', 'string', 'size:6'],
        ]);

        $email = $request->input('email');
        $code = $request->input('code');

        if (!$this->otpService->verify($email, $code)) {
            $this->logAuth('otp.failed', ['email' => $email]);

            return $this->error('INVALID_OTP', 'Invalid or expired code.', 401);
        }

        $user = User::firstOrCreate(
            ['email' => $email],
            ['email_verified_at' => now()->toDateTimeString()],
        );

        if ($user->wasRecentlyCreated) {
            $user->email_verified_at = now()->toDateTimeString();
            $user->save();
            $user->assignRole(UserRole::Customer->value);
        }

        $this->logAuth('otp.verified', ['email' => $email, 'user_id' => $user->id, 'new_user' => $user->wasRecentlyCreated]);

        /** @var string $token */
        $token = $this->guard()->login($user);

        return $this->respondWithToken($token, $user);
    }

    public function resendOtp(SendOtpRequest $request): JsonResponse
    {
        $this->otpService->send($request->validated('email'));

        return $this->success(['message' => 'OTP resent', 'expires_in' => 600]);
    }

    public function refresh(): JsonResponse
    {
        /** @var string $token */
        $token = $this->guard()->refresh();
        /** @var User $user */
        $user = $this->guard()->user();

        return $this->respondWithToken($token, $user);
    }

    public function logout(): JsonResponse
    {
        $this->logAuth('logout', ['user_id' => $this->currentUser()->id]);
        $this->guard()->logout();

        return $this->noContent();
    }

    public function user(): JsonResponse
    {
        /** @var User $user */
        $user = $this->guard()->user();
        $user->loadMissing('subscription');

        $status = $user->subscription?->status;

        return $this->success(['data' => [
            ...$user->toArray(),
            'role' => $user->roles->first()?->name ?? 'customer',
            'subscription_status' => $status instanceof SubscriptionStatus ? $status->value : null,
            'onboarding_completed' => $user->onboarding_completed_at !== null,
        ]]);
    }

    private function guard(): JWTGuard
    {
        /** @var JWTGuard $guard */
        $guard = auth('api');

        return $guard;
    }

    private function respondWithToken(string $token, User $user): JsonResponse
    {
        return $this->success([
            'token' => $token,
            'token_type' => 'bearer',
            'expires_in' => (int) config('jwt.ttl') * 60,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'locale' => $user->locale,
                'role' => $user->roles->first()?->name ?? 'customer',
            ],
        ]);
    }
}

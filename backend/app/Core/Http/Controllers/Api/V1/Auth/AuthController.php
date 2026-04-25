<?php

declare(strict_types=1);

namespace App\Core\Http\Controllers\Api\V1\Auth;

use App\Core\Events\Auth\UserRegistered;
use App\Core\Http\Requests\Api\V1\Auth\SendOtpRequest;
use App\Core\Models\User;
use App\Core\Services\Auth\LinkService;
use App\Core\Services\Auth\OtpService;
use App\Enums\SubscriptionStatus;
use App\Enums\UserRole;
use App\Exceptions\Auth\LinkAlreadyUsedException;
use App\Exceptions\Auth\LinkExpiredException;
use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Traits\LogsActivity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Tymon\JWTAuth\JWTGuard;

class AuthController extends BaseController
{
    use LogsActivity;

    public function __construct(
        private readonly OtpService $otpService,
        private readonly LinkService $linkService,
    ) {
    }

    /**
     * POST /api/v1/auth/otp
     * Send OTP code + magic link to the given email.
     */
    public function sendOtp(SendOtpRequest $request): JsonResponse
    {
        $email      = $request->validated('email');
        $magicToken = $this->otpService->send($email);

        $this->logAuth('otp.sent', ['email' => $email]);

        return $this->success([
            'message'          => 'OTP sent',
            'expires_in'       => 600,
            'magic_link_token' => $magicToken,
        ]);
    }

    /**
     * POST /api/v1/auth/otp/verify
     * Verify the 6-digit OTP code and return a JWT token.
     */
    public function verifyOtp(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'code'  => ['required', 'string', 'size:6'],
        ]);

        $email = $request->input('email');
        $code  = $request->input('code');

        if (! $this->otpService->verify($email, $code)) {
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
            // TODO: extract to AuthRegistrationService
            UserRegistered::dispatch($user);
        }

        $this->logAuth('otp.verified', [
            'email'    => $email,
            'user_id'  => $user->id,
            'new_user' => $user->wasRecentlyCreated,
        ]);

        /** @var string $token */
        $token = $this->guard()->login($user);

        return $this->respondWithToken($token, $user);
    }

    /**
     * POST /api/v1/auth/otp/resend
     * Re-send OTP + magic link (subject to cooldown).
     */
    public function resendOtp(SendOtpRequest $request): JsonResponse
    {
        $email      = $request->validated('email');
        $magicToken = $this->otpService->send($email);

        return $this->success([
            'message'          => 'OTP resent',
            'expires_in'       => 600,
            'magic_link_token' => $magicToken,
        ]);
    }

    /**
     * GET /api/v1/auth/link/{token}/confirm
     * Called when the user clicks the magic link in their email.
     * Marks the token as confirmed; the waiting frontend tab picks it up via polling.
     */
    public function confirmLink(string $token): JsonResponse
    {
        try {
            $this->linkService->confirm($token);
        } catch (LinkAlreadyUsedException) {
            return $this->error('LINK_ALREADY_USED', 'Magic link has already been used.', 422);
        } catch (LinkExpiredException) {
            return $this->error('LINK_EXPIRED', 'Magic link has expired or is invalid.', 422);
        }

        return $this->success([
            'status'  => 'confirmed',
            'message' => 'Login confirmed. You can close this tab.',
        ]);
    }

    /**
     * GET /api/v1/auth/link/{token}/status
     * Frontend polls this endpoint until status becomes "confirmed".
     * Returns a JWT token once confirmed.
     */
    public function linkStatus(string $token): JsonResponse
    {
        try {
            $linkData = $this->linkService->status($token);
        } catch (LinkExpiredException) {
            return $this->error('LINK_EXPIRED', 'Magic link has expired or is invalid.', 422);
        }

        if ($linkData['status'] !== 'confirmed') {
            return $this->success(['status' => 'pending']);
        }

        $user = User::firstOrCreate(
            ['email' => $linkData['email']],
            ['email_verified_at' => now()->toDateTimeString()],
        );

        if ($user->wasRecentlyCreated) {
            $user->email_verified_at = now()->toDateTimeString();
            $user->save();
            $user->assignRole(UserRole::Customer->value);
            // TODO: extract to AuthRegistrationService
            UserRegistered::dispatch($user);
        }

        $this->logAuth('magic_link.login', [
            'email'    => $linkData['email'],
            'user_id'  => $user->id,
            'new_user' => $user->wasRecentlyCreated,
        ]);

        /** @var string $jwtToken */
        $jwtToken = $this->guard()->login($user);

        return $this->success([
            'status'  => 'confirmed',
            ...$this->tokenPayload($jwtToken, $user),
        ]);
    }

    /**
     * POST /api/v1/auth/refresh
     */
    public function refresh(): JsonResponse
    {
        /** @var string $token */
        $token = $this->guard()->refresh();
        /** @var User $user */
        $user = $this->guard()->user();

        return $this->respondWithToken($token, $user);
    }

    /**
     * POST /api/v1/auth/logout
     */
    public function logout(): JsonResponse
    {
        $this->logAuth('logout', ['user_id' => $this->currentUser()->id]);
        $this->guard()->logout();

        return $this->noContent();
    }

    /**
     * GET /api/v1/auth/user
     */
    public function user(): JsonResponse
    {
        /** @var User $user */
        $user = $this->guard()->user();
        $user->loadMissing('subscription');

        $status = $user->subscription?->status;

        return $this->success(['data' => [
            ...$user->toArray(),
            'role'                 => $user->roles->first()?->name ?? 'customer',
            'subscription_status'  => $status instanceof SubscriptionStatus ? $status->value : null,
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
        return $this->success($this->tokenPayload($token, $user));
    }

    /**
     * @return array<string, mixed>
     */
    private function tokenPayload(string $token, User $user): array
    {
        return [
            'token'      => $token,
            'token_type' => 'bearer',
            'expires_in' => (int) config('jwt.ttl') * 60,
            'user'       => [
                'id'     => $user->id,
                'name'   => $user->name,
                'email'  => $user->email,
                'locale' => $user->locale,
                'role'   => $user->roles->first()?->name ?? 'customer',
            ],
        ];
    }
}

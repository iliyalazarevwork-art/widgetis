<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Auth\OtpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Tymon\JWTAuth\JWTGuard;

class AuthController extends Controller
{
    public function __construct(
        private readonly OtpService $otpService,
    ) {
    }

    public function sendOtp(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email', 'max:255'],
        ]);

        $this->otpService->send($request->input('email'));

        return response()->json([
            'message' => 'OTP sent',
            'expires_in' => 600,
        ]);
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
            return response()->json([
                'error' => [
                    'code' => 'INVALID_OTP',
                    'message' => 'Invalid or expired code.',
                ],
            ], 401);
        }

        $user = User::firstOrCreate(
            ['email' => $email],
            ['email_verified_at' => now()->toDateTimeString()],
        );

        if ($user->wasRecentlyCreated) {
            $user->email_verified_at = now()->toDateTimeString();
            $user->save();
        }

        /** @var string $token */
        $token = $this->guard()->login($user);

        return $this->respondWithToken($token, $user);
    }

    public function resendOtp(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email', 'max:255'],
        ]);

        $this->otpService->send($request->input('email'));

        return response()->json([
            'message' => 'OTP resent',
            'expires_in' => 600,
        ]);
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
        $this->guard()->logout();

        return response()->json(status: 204);
    }

    public function user(): JsonResponse
    {
        $user = $this->guard()->user();

        return response()->json(['data' => $user]);
    }

    private function guard(): JWTGuard
    {
        /** @var JWTGuard $guard */
        $guard = auth('api');

        return $guard;
    }

    private function respondWithToken(string $token, User $user): JsonResponse
    {
        return response()->json([
            'token' => $token,
            'token_type' => 'bearer',
            'expires_in' => (int) config('jwt.ttl') * 60,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'locale' => $user->locale,
            ],
        ]);
    }
}

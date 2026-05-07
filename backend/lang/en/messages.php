<?php

declare(strict_types=1);

return [
    'validation_error' => 'The given data was invalid.',
    'site_already_connected' => 'This site is already connected to your account.',
    'site_taken_by_another_account' => 'This site is already registered by another account.',
    'site_limit_reached' => 'Site limit reached (:current/:max). Upgrade your plan.',
    'widget_limit_reached' => 'Widget limit reached (:current/:max). Upgrade your plan or disable some widgets.',
    'subscription_required' => 'Widget configuration requires an active subscription.',
    'script_not_installed' => 'Please install the tracking script on your site before enabling widgets.',
    'otp_request_not_found' => 'OTP request not found.',
    'otp_code_expired' => 'OTP code has expired.',
    'otp_too_many_attempts' => 'Too many verification attempts.',
    'otp_invalid_code' => 'Invalid OTP code.',
    'otp_rate_limit_phone' => 'Too many requests for this phone number. Please try again later.',
    'otp_rate_limit_site' => 'Too many OTP requests for this site. Please try again later.',
    'otp_no_active_provider' => 'SMS sending is not available at the moment.',
    'otp_invalid_session_token' => 'Invalid or expired widget session.',
    'otp_token_audience_mismatch' => 'Invalid widget session token.',
    'otp_session_site_not_found' => 'Site not found for this widget session.',
];

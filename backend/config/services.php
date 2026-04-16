<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'r2' => [
        'public_url' => env('R2_PUBLIC_URL', 'https://cdn.widgetis.com'),
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env(
            'GOOGLE_REDIRECT_URI',
            rtrim((string) env('APP_URL', 'http://localhost'), '/') . '/auth/google/callback'
        ),
    ],

    'widget_builder' => [
        'url' => env('WIDGET_BUILDER_URL', 'http://widget-builder:3200'),
    ],

    'liqpay' => [
        'public_key' => env('LIQPAY_PUBLIC_KEY', ''),
        'private_key' => env('LIQPAY_PRIVATE_KEY', ''),
        'sandbox' => env('LIQPAY_SANDBOX', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | WayForPay
    |--------------------------------------------------------------------------
    |
    | WayForPay has no "sandbox" mode flag: they expose a public test merchant
    | whose credentials are documented at https://wiki.wayforpay.com/. In dev
    | we fall back to those values so the flow works out of the box without
    | real keys; prod must override every env var with production values.
    |
    | merchant_domain_name MUST match the domain registered in the WayForPay
    | merchant cabinet, otherwise checkout requests are rejected with a 1117
    | signature error even when the secret key is correct.
    */
    'wayforpay' => [
        'merchant_account'     => env('WAYFORPAY_MERCHANT_ACCOUNT', 'test_merch_n1'),
        'secret_key'           => env('WAYFORPAY_SECRET_KEY', 'flk3409refn54t54t*FNJRET'),
        'merchant_domain_name' => env('WAYFORPAY_MERCHANT_DOMAIN_NAME', 'www.market.ua'),
        'webhook_url'          => env('WAYFORPAY_WEBHOOK_URL'),
        'return_url'           => env('WAYFORPAY_RETURN_URL'),
        // Initial hosted-checkout amount. WayForPay Purchase does not allow
        // zero, so we charge the minimum and refund it as soon as recToken
        // is captured — net cost of activating the trial stays zero.
        'trial_verify_amount'  => (float) env('WAYFORPAY_TRIAL_VERIFY_AMOUNT', 1.0),
        'auto_refund_trial'    => (bool) env('WAYFORPAY_AUTO_REFUND_TRIAL', true),
    ],

];

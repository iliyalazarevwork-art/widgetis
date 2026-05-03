<?php

declare(strict_types=1);

return [
    'validation_error' => 'Передані дані не пройшли валідацію.',
    'site_already_connected' => 'Цей сайт уже підключено до вашого акаунту.',
    'site_taken_by_another_account' => 'Цей сайт вже зареєстровано іншим акаунтом.',
    'site_limit_reached' => 'Досягнуто ліміт сайтів (:current/:max). Оновіть тарифний план.',
    'widget_limit_reached' => 'Досягнуто ліміт віджетів (:current/:max). Оновіть тарифний план або вимкніть деякі віджети.',
    'subscription_required' => 'Для налаштування віджетів необхідна активна підписка.',
    'otp_request_not_found' => 'Запит OTP не знайдено.',
    'otp_code_expired' => 'Термін дії OTP-коду минув.',
    'otp_too_many_attempts' => 'Забагато спроб підтвердження.',
    'otp_invalid_code' => 'Невірний OTP-код.',
    'otp_rate_limit_phone' => 'Забагато запитів для цього номера телефону. Спробуйте пізніше.',
    'otp_rate_limit_site' => 'Забагато OTP-запитів для цього сайту. Спробуйте пізніше.',
    'otp_no_active_provider' => 'Надсилання SMS наразі недоступне.',
    'otp_invalid_session_token' => 'Недійсна або прострочена сесія віджета.',
    'otp_token_audience_mismatch' => 'Недійсний токен сесії віджета.',
    'otp_session_site_not_found' => 'Сайт для цієї сесії віджета не знайдено.',
];

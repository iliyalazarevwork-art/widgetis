<x-mail::message>
# Оплата успішна

Привіт, {{ $userName }}!

<x-mail::panel>
Ваш платіж на суму **{{ $amount }} {{ $currency }}** успішно отримано.

Дякуємо за оплату!
</x-mail::panel>

Ваша підписка активна. Ви можете користуватися всіма функціями Widgetis.

З повагою,<br>
{{ config('app.name') }}
</x-mail::message>

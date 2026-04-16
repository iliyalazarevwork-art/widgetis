<x-mail::message>
# Тариф оновлено

Привіт, {{ $userName }}!

<x-mail::panel>
@if($oldPlanName)
Ваш тариф змінено з **{{ $oldPlanName }}** на **{{ $newPlanName }}**.
@else
Ваш тариф оновлено до **{{ $newPlanName }}**.
@endif

Новий тариф діє до: **{{ $periodEndDate }}**
</x-mail::panel>

Тепер вам доступні всі функції тарифу **{{ $newPlanName }}**. Насолоджуйтеся розширеними можливостями!

З повагою,<br>
{{ config('app.name') }}
</x-mail::message>

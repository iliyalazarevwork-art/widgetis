@component('mail::message')
# 🔔 Нова заявка на {{ $targetLabel }}

Клієнт залишив заявку через кнопку **«Залишити заявку»** на сайті.

**Телефон:** {{ $phone }}
**Тип:** {{ $targetType === 'plan' ? 'Тариф' : 'Віджет' }}
**Ціль:** {{ $targetLabel }} (`{{ $targetId }}`)
**Час:** {{ $createdAt }}

@component('mail::button', ['url' => 'tel:' . $phone])
Зателефонувати
@endcomponent

Зв'яжіться з клієнтом протягом дня.

Дякуємо,
{{ config('app.name') }}
@endcomponent

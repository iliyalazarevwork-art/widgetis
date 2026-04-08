<x-mail::message>
# Your verification code

Use this code to sign in to Widgetis:

<x-mail::panel>
**{{ $code }}**
</x-mail::panel>

This code expires in 10 minutes. If you didn't request it, ignore this email.

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>

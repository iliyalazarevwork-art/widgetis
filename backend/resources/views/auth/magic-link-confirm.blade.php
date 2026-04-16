<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex,nofollow">
    <title>Widgetis</title>
    <style>
        :root {
            color-scheme: light;
            font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            background: radial-gradient(circle at top, #f6f8ff 0%, #eef1f9 45%, #e8ebf4 100%);
            color: #111827;
            padding: 24px;
        }

        .card {
            width: min(520px, 100%);
            border-radius: 18px;
            padding: 28px 24px;
            background: #ffffff;
            box-shadow: 0 14px 42px rgba(17, 24, 39, 0.12);
            border: 1px solid #e5e7eb;
        }

        .badge {
            display: inline-flex;
            align-items: center;
            padding: 6px 10px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.01em;
            margin-bottom: 14px;
        }

        .badge--success {
            background: #dcfce7;
            color: #166534;
        }

        .badge--warning {
            background: #fef3c7;
            color: #92400e;
        }

        .badge--error {
            background: #fee2e2;
            color: #991b1b;
        }

        h1 {
            margin: 0 0 10px;
            font-size: 24px;
            line-height: 1.25;
        }

        p {
            margin: 0;
            color: #4b5563;
            font-size: 16px;
            line-height: 1.5;
        }
    </style>
</head>
<body>
<main class="card" role="main" aria-live="polite">
    <span class="badge badge--{{ $state }}">
        @if ($state === 'success')
            Підтверджено
        @elseif ($state === 'warning')
            Вже підтверджено
        @else
            Недійсне посилання
        @endif
    </span>
    <h1>{{ $title }}</h1>
    <p>{{ $message }}</p>
</main>
</body>
</html>

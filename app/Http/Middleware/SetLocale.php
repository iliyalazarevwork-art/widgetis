<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /** @var list<string> */
    private const SUPPORTED_LOCALES = ['uk', 'en'];
    private const DEFAULT_LOCALE = 'uk';

    public function handle(Request $request, Closure $next): Response
    {
        $locale = $request->header('Accept-Language', self::DEFAULT_LOCALE);

        $locale = strtolower(substr($locale, 0, 2));

        if (!in_array($locale, self::SUPPORTED_LOCALES, true)) {
            $locale = self::DEFAULT_LOCALE;
        }

        app()->setLocale($locale);

        return $next($request);
    }
}

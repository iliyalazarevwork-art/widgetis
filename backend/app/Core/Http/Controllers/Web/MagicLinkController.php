<?php

declare(strict_types=1);

namespace App\Core\Http\Controllers\Web;

use App\Core\Services\Auth\LinkService;
use App\Exceptions\Auth\LinkAlreadyUsedException;
use App\Exceptions\Auth\LinkExpiredException;
use App\Http\Controllers\Controller;
use Illuminate\Contracts\View\View;

class MagicLinkController extends Controller
{
    public function __construct(
        private readonly LinkService $linkService,
    ) {
    }

    public function confirm(string $token): View
    {
        $state   = 'success';
        $title   = 'Вхід підтверджено';
        $message = 'Можна повернутися до вкладки входу у Widgetis.';

        try {
            $this->linkService->confirm($token);
        } catch (LinkAlreadyUsedException) {
            $state   = 'warning';
            $title   = 'Посилання вже використано';
            $message = 'Вхід уже підтверджений раніше. Поверніться до вкладки входу.';
        } catch (LinkExpiredException) {
            $state   = 'error';
            $title   = 'Посилання недійсне';
            $message = 'Термін дії посилання минув. Запросіть новий код входу.';
        }

        return view('auth.magic-link-confirm', [
            'state' => $state,
            'title' => $title,
            'message' => $message,
        ]);
    }
}

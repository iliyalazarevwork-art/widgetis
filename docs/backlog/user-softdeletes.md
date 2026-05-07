# User SoftDeletes: привести модель и колонку БД к единому состоянию

**Проблема:** колонка `users.deleted_at` существует в БД (осталась от предыдущей версии модели), но `App\Core\Models\User` **не** использует trait `SoftDeletes`. Из-за этого:
- `deleted_at` у 8 юзеров был выставлен (был массовый delete), но Laravel-запросы его игнорируют — юзеры продолжают логиниться как «призраки».
- `JWTAuth::fromUser()` и `auth:api` guard пропускают удалённых юзеров.
- Произошла путаница при дебаге Google OAuth: фронтовой баг (`GoogleCallbackPage` не обновлял `AuthContext`) маскировался призрачным состоянием.

**Варианты решения (выбрать один):**

## Вариант A — вернуть SoftDeletes (рекомендуется)
- [ ] Добавить `use Illuminate\Database\Eloquent\SoftDeletes;` + `use SoftDeletes;` в `backend/app/Models/User.php`
- [ ] В `GoogleAuthController::callback` использовать `User::withTrashed()->firstOrCreate(...)` и, если юзер `$user->trashed()`, либо сделать `$user->restore()`, либо вернуть `redirect($frontendUrl . '/login?error=account_deleted')` (по продуктовому решению)
- [ ] В `AuthController::sendOtp` / `verifyOtp` добавить ту же проверку на `trashed()`
- [ ] Убедиться, что `JWTAuth` subject resolver не отдаёт trashed юзеров (при необходимости переопределить `UserProvider`)
- [ ] Прогнать все места, где `User::find()/where()` — где нужны trashed, явно добавить `withTrashed()`
- [ ] Тесты: логин trashed юзера → 401, успешный login не trashed → 200
- [ ] **Data migration**: восстановить `deleted_at = NULL` для реальных аккаунтов, которые попали под массовое удаление (проверить `users.id` 1, 9, 10 перед решением)

## Вариант B — убрать SoftDeletes окончательно
- [ ] Миграция: `Schema::table('users', fn ($t) => $t->dropColumn('deleted_at'));`
- [ ] Убедиться, что `UserDeletionService::delete()` остаётся единственной точкой удаления (уже вызывает hard delete через `$user->delete()` без trait)

**Почему важно:** если кто-нибудь позже добавит `SoftDeletes` обратно — все ранее «удалённые» записи молча исчезнут из выборок.

# CDN Proxy Protection

Защитить JS бандлы от кражи конкурентами через приватный R2 + прокси на Laravel.

**Проблема:** бандлы лежат на публичном R2 URL — любой может скачать файл напрямую.

**Решение:**
1. Сделать R2 бакет приватным (отключить Public Access)
2. Прокси-эндпоинт `GET /cdn/sites/{domain}/bundle.js` в Laravel
   - Проверяет заголовок `Referer` — домен должен совпадать с зарегистрированным сайтом
   - Если совпадает → достаёт файл из R2 и отдаёт
   - Если нет → 403 Forbidden
   - Redis кэш TTL ~5 минут
3. Скрипт-тег клиента: `<script src="https://widgetis.com/cdn/sites/{domain}/bundle.js">`

**Что реализовать:**
- [ ] Отключить Public Access на R2 бакете
- [ ] Контроллер `CdnController` с методом `bundle(string $domain)`
- [ ] Маршрут `GET /cdn/sites/{domain}/bundle.js`
- [ ] Redis кэш ключ `cdn:bundle:{domain}`, TTL 300 сек
- [ ] Middleware для проверки Referer заголовка

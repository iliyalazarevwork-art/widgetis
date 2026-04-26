FROM php:8.4-fpm-alpine

RUN apk add --no-cache \
    postgresql-dev \
    icu-dev \
    libzip-dev \
    linux-headers \
    && docker-php-ext-install \
    pdo_pgsql \
    intl \
    zip \
    bcmath \
    opcache

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY composer.json composer.lock ./
# NEVER swallow errors here with `|| true` — a silently-failed composer
# install produces an image with an empty vendor/ and the backend then
# restart-loops in prod with "vendor/autoload.php: No such file or
# directory". The build MUST fail loudly if composer can't resolve.
RUN composer install --no-interaction --no-dev --optimize-autoloader --no-scripts

COPY . .

# Publish Filament + Livewire static assets into public/. Without this,
# requests like /css/filament/..., /fonts/filament/..., /livewire/livewire.js
# return 404 in production. Artisan needs a bootable app, so we briefly
# materialize a throwaway .env (real secrets are mounted at runtime).
RUN cp .env.example .env \
 && php artisan key:generate \
 && php artisan filament:assets \
 && php artisan vendor:publish --force --tag=livewire:assets \
 && rm .env

# Stash a snapshot of public/ outside the path that will be overlaid by
# the named volume at runtime. The container's start command copies this
# into the volume on every boot so image rebuilds always refresh the
# assets — Docker only auto-populates a named volume on first creation.
RUN cp -a public /opt/public-template

RUN chown -R www-data:www-data storage bootstrap/cache

EXPOSE 9000

CMD ["php-fpm"]

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

RUN chown -R www-data:www-data storage bootstrap/cache

EXPOSE 9000

CMD ["php-fpm"]

FROM php:8.3-cli

RUN apt-get update && apt-get install -y --no-install-recommends git unzip curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
WORKDIR /app
COPY composer.json ./
RUN composer install --no-interaction --prefer-dist
COPY . .
CMD ["php", "-S", "0.0.0.0:8000", "-t", "public"]

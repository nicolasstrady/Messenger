FROM php:8.1-apache

WORKDIR /app

COPY . .

# Installer les dépendances pour PDO et PostgreSQL
RUN apt-get update && apt-get install -y libpq-dev && \
    docker-php-ext-install pdo pdo_mysql

EXPOSE 8000

CMD ["php", "-S", "0.0.0.0:8000"]

# Аль Бушра — приём заявок

## Запуск

1. Установите Node.js 18 или новее.
2. В настройках окружения сервера задайте `DATABASE_URL` для PostgreSQL. При необходимости также задайте `DATABASE_SSL=true`.
3. Установите зависимости: `npm install`.
4. Создайте таблицу: `npm run migrate`.
5. Запустите: `npm start`.

Сайт доступен по `http://localhost:3000`. Без `DATABASE_URL` форма намеренно не принимает персональные данные: сервер вернёт временную ошибку и ничего не запишет. `APPLICATION_WEBHOOK_URL` остаётся необязательным: если он задан, сервер отправит туда уведомление после записи заявки в PostgreSQL.

## Swagger / OpenAPI

Спецификация находится в [openapi.yaml](openapi.yaml) и [swagger.json](swagger.json). После запуска доступны адреса `http://localhost:3000/api/openapi.yaml`, `http://localhost:3000/openapi.yaml`, `http://localhost:3000/api/swagger.json` и `http://localhost:3000/swagger.json`. Интерактивная Swagger UI находится на `http://localhost:3000/swagger`. Спецификацию также можно импортировать в Swagger Editor, Postman или Insomnia.

## Защита данных

- Браузер передаёт форму только на same-origin `POST /api/applications`; localStorage и sessionStorage не используются.
- API валидирует и ограничивает размер входящих данных, добавляет honeypot и ограничивает до 5 попыток за 15 минут с одного IP.
- Данные не логируются и не сохраняются в браузере. Сервер записывает их в PostgreSQL параметризованным запросом.
- Для production разместите сайт за HTTPS, храните `DATABASE_URL` в секретах окружения и обеспечьте для роли БД только нужные права (`INSERT` для API), срок хранения и аудит.

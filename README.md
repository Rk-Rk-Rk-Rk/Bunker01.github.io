# Игра "Бункер"

Многопользовательская веб-игра "Бункер" для игры с друзьями.

## Установка

1. Клонируйте репозиторий:
```bash
git clone https://github.com/ваш-username/bunker-game.git
cd bunker-game
```

2. Установите зависимости:
```bash
npm install
```

3. Запустите сервер:
```bash
npm start
```

4. Откройте игру в браузере по адресу: `http://localhost:3000`

## Как играть

1. Создайте новую игру или присоединитесь к существующей
2. Пригласите друзей, отправив им ID игры
3. Начните игру, когда все игроки присоединились

## Технические детали

- Сервер: Node.js + Express
- Веб-сокеты: Socket.IO
- Клиент: HTML, CSS, JavaScript

## Развертывание

Для развертывания на Heroku:

1. Создайте аккаунт на [Heroku](https://heroku.com)
2. Установите [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
3. Выполните команды:
```bash
heroku login
heroku create
git push heroku main
```

## Лицензия

MIT 
# DevFlowState

Веб-приложение с инструментами для разработчиков: конвертер фото/видео и тест скорости интернета.

## 🚀 Возможности

### Photo/Video Converter
- Конвертация изображений: JPEG, PNG, WEBP, GIF, BMP, TIFF, AVIF, ICO
- Векторизация в SVG (ImageTracer)
- Изменение размеров
- Регулировка качества
- Автоудаление результатов через 5 минут

### Speedtest
- Измерение Ping
- Тест Download скорости
- Тест Upload скорости
- Отображение IP адреса
- Real-time gauge индикатор

## 📦 Установка

### Через Docker (рекомендуется)

```bash
# Сборка и запуск
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановка
docker-compose down
```

Приложение доступно по адресу: http://localhost:3000

### Ручная установка

```bash
# Установка зависимостей
npm install

# Запуск
npm start
```

### На VPS (Ubuntu/Debian)

```bash
# Установка Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Клонирование репозитория
cd /var/www
git clone <repository-url> devflowstate
cd devflowstate

# Установка зависимостей
npm install --production

# Копирование systemd сервиса
sudo cp devflowstate.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable devflowstate
sudo systemctl start devflowstate

# Проверка статуса
sudo systemctl status devflowstate
```

## 🔧 Конфигурация

### Переменные окружения

| Переменная | Значение по умолчанию | Описание |
|------------|----------------------|----------|
| `PORT` | 3000 | Порт сервера |
| `HOST` | 0.0.0.0 | Хост сервера |
| `NODE_ENV` | production | Режим работы |

### Nginx (для HTTPS)

1. Установите Nginx:
```bash
sudo apt install nginx
```

2. Настройте SSL (Let's Encrypt):
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

3. Скопируйте конфигурацию:
```bash
sudo cp nginx.conf /etc/nginx/sites-available/devflowstate
sudo ln -s /etc/nginx/sites-available/devflowstate /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 📡 API Endpoints

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/ip` | Информация о клиенте |
| GET | `/api/ping` | Ping тест |
| GET | `/api/download/:size` | Download тест (1mb, 5mb, 10mb) |
| POST | `/api/upload` | Upload тест |

## 🗂️ Структура проекта

```
devflowstate/
├── server.js              # Основной сервер
├── package.json           # Зависимости
├── Dockerfile            # Docker образ
├── docker-compose.yml    # Docker Compose
├── nginx.conf            # Nginx конфигурация
├── devflowstate.service  # systemd сервис
├── index.html            # Главная страница
├── style.css             # Основные стили
├── script.js             # Общий JavaScript
├── components/
│   └── header.html       # Header компонент
├── photo-video-converter/
│   ├── index.html        # Страница конвертера
│   ├── converter.css     # Стили конвертера
│   └── converter.js      # Логика конвертера
└── speedtest/
    ├── index.html        # Страница speedtest
    ├── speedtest.css     # Стили speedtest
    └── speedtest.js      # Логика speedtest
```

## 🔒 Безопасность

- Helmet.js для защиты заголовков
- CORS настроен
- Compression для оптимизации
- Morgan для логирования

## 📝 Лицензия

MIT
# devflowstate

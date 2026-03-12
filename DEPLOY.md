# DevFlowState Production Deployment Guide

## Быстрый старт с Docker

```bash
# 1. Сборка образа
docker-compose build

# 2. Запуск контейнера
docker-compose up -d

# 3. Проверка логов
docker-compose logs -f

# 4. Остановка
docker-compose down
```

## Запуск через PM2 (рекомендуется для VPS)

```bash
# 1. Установка Node.js и PM2
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# 2. Установка приложения
cd /var/www/devflowstate
npm install --production

# 3. Запуск через PM2
pm2 start ecosystem.config.js

# 4. Автозагрузка при старте системы
pm2 startup systemd
pm2 save

# 5. Управление
pm2 status              # Статус приложений
pm2 logs devflowstate   # Просмотр логов
pm2 restart devflowstate # Перезапуск
pm2 stop devflowstate   # Остановка
pm2 delete devflowstate # Удаление из списка
pm2 monit              # Мониторинг в реальном времени
```

## Деплой на VPS (Ubuntu 22.04)

### 1. Подготовка сервера

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Проверка установки
docker --version
docker-compose --version
```

### 2. Загрузка приложения

```bash
# Клонирование репозитория
cd /var/www
sudo git clone <your-repo-url> devflowstate
sudo chown -R $USER:$USER devflowstate
cd devflowstate

# Или загрузка архивом
wget https://github.com/your-repo/archive/main.zip
unzip main.zip
mv devflowstate-main devflowstate
cd devflowstate
```

### 3. Запуск через Docker

```bash
# Сборка и запуск
docker-compose up -d --build

# Проверка
docker-compose ps
docker-compose logs -f
```

### 4. Настройка Nginx (опционально, для HTTPS)

```bash
# Установка Nginx
sudo apt install nginx -y

# Копирование конфига
sudo cp nginx.conf /etc/nginx/sites-available/devflowstate

# Редактирование (замените домен)
sudo nano /etc/nginx/sites-available/devflowstate
# Замените your-domain.com на ваш домен

# Активация
sudo ln -s /etc/nginx/sites-available/devflowstate /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Установка SSL (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

### 5. Мониторинг

```bash
# Логи приложения
docker-compose logs -f

# Статус контейнера
docker-compose ps

# Использование ресурсов
docker stats devflowstate

# Перезапуск
docker-compose restart

# Остановка
docker-compose down

# Запуск
docker-compose up -d
```

## Переменные окружения

Создайте файл `.env` для настройки:

```bash
cp .env.example .env
nano .env
```

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| `PORT` | 3000 | Порт сервера |
| `HOST` | 0.0.0.0 | Хост |
| `NODE_ENV` | production | Режим |

## Troubleshooting

### Порт уже занят

```bash
# Найти процесс на порту 3000
sudo lsof -i :3000

# Убить процесс
sudo kill -9 <PID>
```

### Ошибки Docker

```bash
# Пересборка без кэша
docker-compose build --no-cache

# Очистка старых образов
docker system prune -a
```

### Проблемы с Nginx

```bash
# Проверка конфигурации
sudo nginx -t

# Перезагрузка
sudo systemctl reload nginx

# Логи
sudo tail -f /var/log/nginx/devflowstate.error.log
```

## Обновление приложения

```bash
# Pull изменений
cd /var/www/devflowstate
sudo git pull

# Пересборка и перезапуск
docker-compose up -d --build
```

## Бэкап

```bash
# Сохранение данных
tar -czf devflowstate-backup-$(date +%Y%m%d).tar.gz /var/www/devflowstate
```

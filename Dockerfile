# DevFlowState Docker Image
FROM node:18-alpine

# Установка рабочей директории
WORKDIR /app

# Копирование package файлов
COPY package*.json ./

# Установка зависимостей
RUN npm ci --only=production

# Копирование исходного кода
COPY . .

# Создание директории для временных файлов
RUN mkdir -p /app/tmp

# Экспозиция порта
EXPOSE 3000

# Переменные окружения
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Запуск приложения
CMD ["node", "server.js"]

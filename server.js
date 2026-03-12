/**
 * DevFlowState Production Server (без внешних зависимостей)
 * Обслуживает главную страницу, конвертер и speedtest
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const zlib = require('zlib');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// MIME типы
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

// Генерация данных для download теста
function generateDataChunk(size) {
  return Buffer.alloc(size, 'x');
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  
  // CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API: Информация о клиенте
  if (url.pathname === '/api/ip') {
    const clientIp = req.socket.remoteAddress || req.connection.remoteAddress;
    const ip = clientIp?.replace('::ffff:', '') || 'unknown';
    
    // Простая эмуляция локации по IP (для локального использования)
    // В продакшене можно подключить maxmind geoip-db
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ip: ip,
      isp: 'Local Network',
      location: 'localhost',
      country: 'Unknown',
      city: 'Unknown'
    }));
    return;
  }

  // API: Ping test
  if (url.pathname === '/api/ping') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    res.end(JSON.stringify({ ping: Date.now() }));
    return;
  }

  // API: Download test
  if (url.pathname.startsWith('/api/download/')) {
    const sizeMap = {
      '1mb': 1 * 1024 * 1024,
      '5mb': 5 * 1024 * 1024,
      '10mb': 10 * 1024 * 1024
    };
    
    const sizeKey = url.pathname.split('/').pop().toLowerCase();
    const size = sizeMap[sizeKey];
    
    if (!size) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Size not found' }));
      return;
    }
    
    res.writeHead(200, {
      'Content-Type': 'application/octet-stream',
      'Content-Length': size,
      'Cache-Control': 'no-cache'
    });
    
    // Отправка данных чанками
    const chunkSize = 64 * 1024;
    let sent = 0;
    
    const sendChunk = () => {
      if (sent >= size) {
        res.end();
        return;
      }
      
      const remaining = size - sent;
      const toSend = Math.min(chunkSize, remaining);
      const chunk = generateDataChunk(toSend);
      
      if (res.write(chunk)) {
        sent += toSend;
        setImmediate(sendChunk);
      } else {
        res.once('drain', () => {
          sent += toSend;
          setImmediate(sendChunk);
        });
      }
    };
    
    sendChunk();
    return;
  }

  // API: Upload test
  if (url.pathname === '/api/upload' && req.method === 'POST') {
    let receivedSize = 0;
    
    req.on('data', (chunk) => {
      receivedSize += chunk.length;
    });
    
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        received: receivedSize,
        timestamp: Date.now()
      }));
    });
    
    req.on('error', () => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Upload failed' }));
    });
    return;
  }

  // Статические файлы
  let filePath = path.join(__dirname, url.pathname);
  
  // Редиректы для чистых URL
  if (url.pathname === '/speedtest' || url.pathname === '/photo-video-converter') {
    res.writeHead(302, { 'Location': url.pathname + '/' });
    res.end();
    return;
  }
  
  // Добавляем index.html для директорий
  if (url.pathname.endsWith('/')) {
    filePath = path.join(filePath, 'index.html');
  }
  
  // Проверка существования файла
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // 404 для API
      if (url.pathname.startsWith('/api/')) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
        return;
      }
      
      // Главная страница для неизвестных путей
      filePath = path.join(__dirname, 'index.html');
    }
    
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    // Сжатие gzip
    const acceptEncoding = req.headers['accept-encoding'] || '';
    const shouldCompress = acceptEncoding.includes('gzip') && 
      ['.html', '.css', '.js', '.json'].includes(ext);
    
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error reading file');
        return;
      }
      
      if (shouldCompress) {
        zlib.gzip(data, (err, compressed) => {
          if (err) {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
          } else {
            res.writeHead(200, {
              'Content-Type': contentType,
              'Content-Encoding': 'gzip',
              'Vary': 'Accept-Encoding'
            });
            res.end(compressed);
          }
        });
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
      }
    });
  });
});

server.listen(PORT, HOST, () => {
  const localIp = getLocalIP();
  console.log('\n🚀 DevFlowState Server');
  console.log(`\n📍 Local:    http://localhost:${PORT}`);
  console.log(`📍 Network:  http://${localIp}:${PORT}`);
  console.log(`\n📁 Pages:`);
  console.log(`   /                    - Главная`);
  console.log(`   /photo-video-converter/ - Конвертер`);
  console.log(`   /speedtest/          - Тест скорости`);
  console.log(`\n🔌 API:`);
  console.log(`   GET  /api/ip          - IP инфо`);
  console.log(`   GET  /api/ping        - Ping`);
  console.log(`   GET  /api/download/:size - Download`);
  console.log(`   POST /api/upload      - Upload`);
  console.log(`\nPress Ctrl+C to stop\n`);
});

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

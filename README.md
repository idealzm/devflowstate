# DevFlowState

Personal multi-page website with utilities (Speedtest, Photo/Video Converter).

## Project Structure

```
devflowstate/
├── server/              # Node.js server
│   └── index.js         # Express server with API
├── public/              # Static files
│   ├── css/             # Stylesheets
│   ├── js/              # JavaScript files
│   ├── img/             # Images
│   ├── index.html       # Main page
│   ├── speedtest.html   # Speedtest page
│   └── converter.html   # Converter page
├── uploads/             # Temporary file storage (auto-created)
├── logs/                # PM2 logs (auto-created)
├── package.json         # Node.js dependencies
├── ecosystem.config.js  # PM2 configuration
├── .env                 # Environment variables
└── .env.example         # Environment variables template
```

## Requirements

- Node.js 18+ 
- npm or yarn
- PM2 (for production)
- FFmpeg (for video conversion)

## Installation

### 1. Install System Dependencies

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install -y ffmpeg nodejs npm
```

**CentOS/RHEL:**
```bash
sudo yum install -y ffmpeg nodejs npm
```

**macOS:**
```bash
brew install ffmpeg node
```

### 2. Install Node.js Dependencies

```bash
cd /path/to/devflowstate
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
nano .env  # Edit if needed
```

### 4. Install PM2 (for production)

```bash
npm install -g pm2
```

## Running the Application

### Development Mode

```bash
npm run dev
```

### Production Mode (PM2)

```bash
# Start
npm run pm2:start

# Or directly
pm2 start ecosystem.config.js

# View logs
pm2 logs devflowstate

# Monitor
pm2 monit

# Stop
pm2 stop devflowstate

# Restart
pm2 restart devflowstate
```

### Setup PM2 on Startup (auto-restart on server reboot)

```bash
pm2 startup
pm2 save
```

## API Endpoints

### Convert Image
```
POST /api/convert/image
Content-Type: multipart/form-data

Parameters:
- file: Image file
- format: Target format (jpg, png, webp, gif, bmp, tiff, avif)
- quality: Quality level (1-100, default: 80)

Response:
{
  "success": true,
  "filename": "uuid.jpg",
  "downloadUrl": "/download/uuid.jpg",
  "size": 12345,
  "format": "jpg"
}
```

### Convert Video
```
POST /api/convert/video
Content-Type: multipart/form-data

Parameters:
- file: Video file
- format: Target format (mp4, webm, avi, mov, mkv, flv, wmv, m4v)
- quality: Quality preset (low, medium, high, ultra)

Response:
{
  "success": true,
  "filename": "uuid.mp4",
  "downloadUrl": "/download/uuid.mp4",
  "size": 12345678,
  "format": "mp4"
}
```

### Download File
```
GET /download/:filename
```

### Get File Info
```
GET /api/file/:filename

Response:
{
  "exists": true,
  "filename": "uuid.mp4",
  "size": 12345678,
  "timeLeft": 300
}
```

## File Cleanup

Files are automatically deleted after 5 minutes. The cleanup runs every minute.

## Pages

- `/` - Main page with multilingual welcome
- `/speedtest` - Internet speed test
- `/converter` - Photo/Video converter

## License

ISC
# devflowstate

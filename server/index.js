const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Ensure directories exist
[UPLOAD_DIR, PUBLIC_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(PUBLIC_DIR));

// Configure multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${uuidv4()}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 500 * 1024 * 1024 // 500MB limit
    }
});

// File cleanup - delete files older than 5 minutes
function cleanupOldFiles() {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes

    fs.readdir(UPLOAD_DIR, (err, files) => {
        if (err) return;

        files.forEach(file => {
            const filePath = path.join(UPLOAD_DIR, file);
            fs.stat(filePath, (err, stats) => {
                if (err) return;

                if (now - stats.mtimeMs > maxAge) {
                    fs.unlink(filePath, () => {});
                }
            });
        });
    });
}

// Run cleanup every minute
setInterval(cleanupOldFiles, 60 * 1000);

// Image formats
const IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'avif'];
const VIDEO_FORMATS = ['mp4', 'webm', 'avi', 'mov', 'mkv', 'flv', 'wmv', 'm4v'];

// Convert image
app.post('/api/convert/image', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { format, quality = 80 } = req.body;
        const inputPath = req.file.path;
        const outputFormat = format.toLowerCase();

        if (!IMAGE_FORMATS.includes(outputFormat.replace('.', ''))) {
            fs.unlinkSync(inputPath);
            return res.status(400).json({ error: 'Unsupported format' });
        }

        const outputFilename = `${path.basename(inputPath, path.extname(inputPath))}.${outputFormat}`;
        const outputPath = path.join(UPLOAD_DIR, outputFilename);

        let sharpInstance = sharp(inputPath);

        // Apply transformations based on format
        switch (outputFormat) {
            case 'jpg':
            case 'jpeg':
                await sharpInstance.jpeg({ quality: parseInt(quality) }).toFile(outputPath);
                break;
            case 'png':
                await sharpInstance.png({ compressionLevel: 9 }).toFile(outputPath);
                break;
            case 'webp':
                await sharpInstance.webp({ quality: parseInt(quality) }).toFile(outputPath);
                break;
            case 'gif':
                await sharpInstance.gif().toFile(outputPath);
                break;
            case 'avif':
                await sharpInstance.avif({ quality: parseInt(quality) }).toFile(outputPath);
                break;
            default:
                await sharpInstance.toFile(outputPath);
        }

        // Delete original file
        fs.unlinkSync(inputPath);

        const stats = fs.statSync(outputPath);

        res.json({
            success: true,
            filename: outputFilename,
            downloadUrl: `/download/${outputFilename}`,
            size: stats.size,
            format: outputFormat
        });

    } catch (error) {
        console.error('Image conversion error:', error);
        res.status(500).json({ error: 'Conversion failed' });
    }
});

// Convert video
app.post('/api/convert/video', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const { format, quality = 'medium' } = req.body;
    const inputPath = req.file.path;
    const outputFormat = format.toLowerCase().replace('.', '');

    if (!VIDEO_FORMATS.includes(outputFormat)) {
        fs.unlinkSync(inputPath);
        return res.status(400).json({ error: 'Unsupported format' });
    }

    const outputFilename = `${path.basename(inputPath, path.extname(inputPath))}.${outputFormat}`;
    const outputPath = path.join(UPLOAD_DIR, outputFilename);

    // Quality presets
    const qualityPresets = {
        low: '28',
        medium: '23',
        high: '18',
        ultra: '15'
    };

    const crf = qualityPresets[quality] || '23';

    ffmpeg(inputPath)
        .outputOptions([
            `-crf ${crf}`,
            '-preset medium',
            '-c:a aac',
            '-b:a 128k'
        ])
        .on('end', () => {
            // Delete original file
            fs.unlinkSync(inputPath);

            const stats = fs.statSync(outputPath);

            res.json({
                success: true,
                filename: outputFilename,
                downloadUrl: `/download/${outputFilename}`,
                size: stats.size,
                format: outputFormat
            });
        })
        .on('error', (err) => {
            console.error('Video conversion error:', err);
            fs.unlinkSync(inputPath);
            res.status(500).json({ error: 'Conversion failed' });
        })
        .save(outputPath);
});

// Download file
app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(UPLOAD_DIR, filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
    }

    res.download(filePath, filename);
});

// Get file info
app.get('/api/file/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(UPLOAD_DIR, filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
    }

    const stats = fs.statSync(filePath);
    const timeLeft = Math.max(0, 5 * 60 - (Date.now() - stats.mtimeMs) / 1000);

    res.json({
        exists: true,
        filename,
        size: stats.size,
        timeLeft: Math.round(timeLeft)
    });
});

// Serve main pages
app.get('/', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.get('/speedtest', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'speedtest.html'));
});

app.get('/converter', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'converter.html'));
});

// Handle 404 for static files
app.use((req, res, next) => {
    res.status(404).sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Upload directory: ${UPLOAD_DIR}`);
});

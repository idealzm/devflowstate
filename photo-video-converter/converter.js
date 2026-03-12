class PhotoVideoConverter {
  constructor() {
    this.files = [];
    this.results = [];
    this.autoDeleteTimer = null;
    this.countdownInterval = null;
    this.AUTO_DELETE_MINUTES = 5;
    this.initElements();
    this.bindEvents();
  }

  initElements() {
    this.uploadArea = document.getElementById('upload-area');
    this.fileInput = document.getElementById('file-input');
    this.settingsArea = document.getElementById('settings-area');
    this.filesList = document.getElementById('files-list');
    this.resultsArea = document.getElementById('results-area');
    this.resultsList = document.getElementById('results-list');
    this.outputFormat = document.getElementById('output-format');
    this.quality = document.getElementById('quality');
    this.qualityValue = document.getElementById('quality-value');
    this.widthInput = document.getElementById('width');
    this.heightInput = document.getElementById('height');
    this.convertBtn = document.getElementById('convert-btn');
    this.downloadAllBtn = document.getElementById('download-all-btn');
    this.countdownElement = document.getElementById('countdown');
  }

  bindEvents() {
    // Drag & drop
    this.uploadArea.addEventListener('click', () => this.fileInput.click());
    this.uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.uploadArea.classList.add('dragover');
    });
    this.uploadArea.addEventListener('dragleave', () => {
      this.uploadArea.classList.remove('dragover');
    });
    this.uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      this.uploadArea.classList.remove('dragover');
      this.handleFiles(e.dataTransfer.files);
    });
    this.fileInput.addEventListener('change', (e) => {
      this.handleFiles(e.target.files);
    });

    // Settings
    this.quality.addEventListener('input', () => {
      this.qualityValue.textContent = this.quality.value;
    });

    this.outputFormat.addEventListener('change', () => {
      this.updateSettings();
    });

    // Convert
    this.convertBtn.addEventListener('click', () => this.convert());
    this.downloadAllBtn.addEventListener('click', () => this.downloadAll());
  }

  handleFiles(fileList) {
    const newFiles = Array.from(fileList).filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );

    newFiles.forEach(file => {
      this.files.push({
        file,
        id: Date.now() + Math.random(),
        uploadedAt: Date.now()
      });
    });

    this.renderFilesList();
    this.updateUI();
  }

  renderFilesList() {
    this.filesList.innerHTML = this.files.map(item => `
      <div class="file-item" data-id="${item.id}">
        ${this.getFilePreview(item.file)}
        <div class="file-info">
          <div class="file-name">${item.file.name}</div>
          <div class="file-size">${this.formatSize(item.file.size)}</div>
        </div>
        <button class="file-remove" data-id="${item.id}">&times;</button>
      </div>
    `).join('');

    // Bind remove events
    this.filesList.querySelectorAll('.file-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseFloat(e.target.dataset.id);
        this.removeFile(id);
      });
    });
  }

  getFilePreview(file) {
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      return `<img src="${url}" class="file-preview" alt="${file.name}">`;
    } else if (file.type.startsWith('video/')) {
      return `<div class="file-preview" style="display:flex;align-items:center;justify-content:center;background:#111;">🎬</div>`;
    }
    return `<div class="file-preview" style="display:flex;align-items:center;justify-content:center;background:#111;">📄</div>`;
  }

  removeFile(id) {
    this.files = this.files.filter(f => f.id !== id);
    this.renderFilesList();
    this.updateUI();
  }

  updateUI() {
    if (this.files.length > 0) {
      this.settingsArea.style.display = 'block';
    } else {
      this.settingsArea.style.display = 'none';
    }

    if (this.results.length > 0 && this.files.length === 0) {
      this.startAutoDeleteTimer();
    }
  }

  updateSettings() {
    const format = this.outputFormat.value;
    const isImage = format.startsWith('image/');
    
    document.getElementById('quality-group').style.display = isImage ? 'block' : 'none';
    document.getElementById('width-group').style.display = isImage ? 'block' : 'none';
    document.getElementById('height-group').style.display = isImage ? 'block' : 'none';
  }

  startAutoDeleteTimer() {
    // Clear existing timers
    if (this.autoDeleteTimer) clearTimeout(this.autoDeleteTimer);
    if (this.countdownInterval) clearInterval(this.countdownInterval);

    const deleteTime = Date.now() + (this.AUTO_DELETE_MINUTES * 60 * 1000);
    let remainingSeconds = this.AUTO_DELETE_MINUTES * 60;

    // Update countdown display
    this.updateCountdown(remainingSeconds);

    // Start countdown timer
    this.countdownInterval = setInterval(() => {
      remainingSeconds--;
      this.updateCountdown(remainingSeconds);

      if (remainingSeconds <= 0) {
        clearInterval(this.countdownInterval);
      }
    }, 1000);

    // Set auto-delete timer
    this.autoDeleteTimer = setTimeout(() => {
      this.clearAllResults();
    }, this.AUTO_DELETE_MINUTES * 60 * 1000);
  }

  updateCountdown(seconds) {
    if (!this.countdownElement) return;
    
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    this.countdownElement.textContent = `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  clearAllResults() {
    // Revoke all URLs to free memory
    this.results.forEach(result => {
      if (result.url) {
        URL.revokeObjectURL(result.url);
      }
    });

    this.results = [];
    this.resultsArea.style.display = 'none';
    this.resultsList.innerHTML = '';
    
    if (this.autoDeleteTimer) clearTimeout(this.autoDeleteTimer);
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    
    alert('Файлы автоматически удалены по истечении 5 минут');
  }

  async convert() {
    if (this.files.length === 0) return;

    this.convertBtn.disabled = true;
    this.convertBtn.textContent = 'Конвертирование...';
    this.results = [];

    // Clear existing timers
    if (this.autoDeleteTimer) clearTimeout(this.autoDeleteTimer);
    if (this.countdownInterval) clearInterval(this.countdownInterval);

    const format = this.outputFormat.value;
    const quality = parseInt(this.quality.value) / 100;
    const width = this.widthInput.value ? parseInt(this.widthInput.value) : null;
    const height = this.heightInput.value ? parseInt(this.heightInput.value) : null;

    for (const item of this.files) {
      try {
        const result = await this.convertFile(item.file, format, quality, width, height);
        this.results.push({
          originalName: item.file.name,
          ...result
        });
      } catch (error) {
        console.error('Error converting file:', error);
      }
    }

    this.renderResults();
    this.convertBtn.disabled = false;
    this.convertBtn.textContent = 'Конвертировать';
    
    // Start auto-delete timer after conversion
    this.startAutoDeleteTimer();
  }

  async convertFile(file, format, quality, width, height) {
    if (file.type.startsWith('image/')) {
      // Проверяем, включена ли векторизация
      const isTracer = format.includes('tracer=true');
      const actualFormat = format.split(';')[0];
      
      if (isTracer) {
        return await this.convertToSvgTracer(file);
      }
      if (actualFormat === 'image/svg+xml') {
        return await this.convertToSvg(file, width, height);
      }
      return await this.convertImage(file, actualFormat, quality, width, height);
    } else if (file.type.startsWith('video/')) {
      return await this.convertVideo(file, format);
    }
    throw new Error('Unsupported file type');
  }

  async convertImage(file, format, quality, width, height) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);

        // Calculate dimensions
        let finalWidth = width || img.width;
        let finalHeight = height || img.height;

        if (width && !height) {
          finalHeight = Math.round(img.height * (width / img.width));
        } else if (height && !width) {
          finalWidth = Math.round(img.width * (height / img.height));
        }

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = finalWidth;
        canvas.height = finalHeight;
        const ctx = canvas.getContext('2d');

        // Draw with scaling
        ctx.drawImage(img, 0, 0, finalWidth, finalHeight);

        // Convert
        canvas.toBlob((blob) => {
          if (blob) {
            const extension = this.getExtensionFromFormat(format);
            resolve({
              blob,
              format: extension,
              size: blob.size,
              url: URL.createObjectURL(blob)
            });
          } else {
            reject(new Error('Conversion failed'));
          }
        }, format, quality);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  }

  async convertToSvg(file, width, height) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);

        let finalWidth = width || img.width;
        let finalHeight = height || img.height;

        if (width && !height) {
          finalHeight = Math.round(img.height * (width / img.width));
        } else if (height && !width) {
          finalWidth = Math.round(img.width * (height / img.height));
        }

        // Create SVG with embedded image
        const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${finalWidth}" height="${finalHeight}" viewBox="0 0 ${finalWidth} ${finalHeight}">
  <image href="${url}" width="${finalWidth}" height="${finalHeight}" preserveAspectRatio="xMidYMid slice"/>
</svg>`;

        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        resolve({
          blob,
          format: 'svg',
          size: blob.size,
          url: URL.createObjectURL(blob)
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  }

  async convertToSvgTracer(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);

      // ImageTracer настройки для лучшей векторизации
      const options = {
        ltres: 1,
        qtres: 1,
        pathomit: 8,
        rightangleenhance: false,
        colorsampling: 2,
        numberofcolors: 16,
        mincolorratio: 0,
        colorquantcycles: 3,
        scale: 1,
        simplify: 0,
        linefilter: false,
        roundcoords: 2,
        lcpr: 0,
        qcpr: 0,
        desc: false,
        viewbox: true
      };

      ImageTracer.imageToSVG(url, (svgString) => {
        URL.revokeObjectURL(url);

        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        resolve({
          blob,
          format: 'svg',
          size: blob.size,
          url: URL.createObjectURL(blob)
        });
      }, options);
    });
  }

  async convertVideo(file, format) {
    // Для видео просто возвращаем тот же файл
    // В реальном проекте здесь нужен был бы серверный конвертер или FFmpeg.wasm
    const extension = this.getExtensionFromFormat(format);
    return {
      blob: file,
      format: extension,
      size: file.size,
      url: URL.createObjectURL(file)
    };
  }

  getExtensionFromFormat(format) {
    const formatMap = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/bmp': 'bmp',
      'image/tiff': 'tiff',
      'image/avif': 'avif',
      'image/x-icon': 'ico',
      'image/svg+xml': 'svg',
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'video/x-msvideo': 'avi',
      'video/quicktime': 'mov',
      'video/x-matroska': 'mkv'
    };
    return formatMap[format] || 'bin';
  }

  renderResults() {
    if (this.results.length === 0) return;

    this.resultsArea.style.display = 'block';
    this.resultsList.innerHTML = this.results.map((result, index) => `
      <div class="result-item">
        ${this.getResultPreview(result)}
        <div class="result-info">
          <div class="result-name">${result.originalName} → ${result.format}</div>
          <div class="result-size">${this.formatSize(result.size)}</div>
        </div>
        <a href="${result.url}" download="converted_${index + 1}.${result.format}" class="download-btn">Скачать</a>
      </div>
    `).join('');
  }

  getResultPreview(result) {
    if (result.format.match(/jpg|jpeg|png|webp|gif|bmp|tiff|avif|ico|svg/)) {
      return `<img src="${result.url}" class="result-preview" alt="result">`;
    }
    return `<div class="result-preview" style="display:flex;align-items:center;justify-content:center;background:#111;">🎬</div>`;
  }

  downloadAll() {
    this.results.forEach((result, index) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = result.url;
        a.download = `converted_${index + 1}.${result.format}`;
        a.click();
      }, index * 200);
    });
  }

  formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Cleanup on page unload
  destroy() {
    if (this.autoDeleteTimer) clearTimeout(this.autoDeleteTimer);
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    this.results.forEach(result => {
      if (result.url) URL.revokeObjectURL(result.url);
    });
    this.files.forEach(file => {
      // File URLs are managed by browser
    });
  }
}

// Initialize
let converter;
document.addEventListener('DOMContentLoaded', () => {
  converter = new PhotoVideoConverter();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (converter) converter.destroy();
});

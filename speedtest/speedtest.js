class Speedtest {
  constructor() {
    this.initElements();
    this.bindEvents();
    this.isRunning = false;
    this.loadConnectionInfo();
  }

  initElements() {
    this.startBtn = document.getElementById('start-btn');
    this.speedValue = document.getElementById('speed-value');
    this.downloadValue = document.getElementById('download-value');
    this.uploadValue = document.getElementById('upload-value');
    this.pingValue = document.getElementById('ping-value');
    this.statusText = document.getElementById('status-text');
    this.progressContainer = document.getElementById('progress-container');
    this.progressFill = document.getElementById('progress-fill');
    this.phasePing = document.getElementById('phase-ping');
    this.phaseDownload = document.getElementById('phase-download');
    this.phaseUpload = document.getElementById('phase-upload');
    this.gaugeFill = document.querySelector('.gauge-fill');
    this.ipAddress = document.getElementById('ip-address');
    this.isp = document.getElementById('isp');
    this.location = document.getElementById('location');
    
    // API endpoints сервера
    this.apiUrl = window.location.origin;
  }

  bindEvents() {
    this.startBtn.addEventListener('click', () => this.startTest());
  }

  async loadConnectionInfo() {
    try {
      const response = await fetch(`${this.apiUrl}/api/ip`);
      const data = await response.json();
      
      if (data.ip && data.ip !== 'unknown') {
        this.ipAddress.textContent = data.ip;
        this.isp.textContent = data.isp || '--';
        this.location.textContent = data.location || data.city || '--';
        return;
      }
    } catch (e) {
      console.log('IP API failed:', e.message);
    }
    
    this.ipAddress.textContent = '--';
    this.isp.textContent = '--';
    this.location.textContent = '--';
  }

  async startTest() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.startBtn.disabled = true;
    this.progressContainer.style.display = 'block';

    this.speedValue.textContent = '0.00';
    this.downloadValue.textContent = '--';
    this.uploadValue.textContent = '--';
    this.pingValue.textContent = '--';
    this.gaugeFill.style.strokeDashoffset = 251.2;

    const results = { ping: 0, download: 0, upload: 0 };

    try {
      this.setActivePhase('ping');
      this.statusText.textContent = 'Измерение пинга...';
      results.ping = await this.measurePing();
      this.pingValue.textContent = Math.round(results.ping);
      this.updateProgress(25);

      this.setActivePhase('download');
      this.statusText.textContent = 'Тестирование загрузки...';
      results.download = await this.measureDownload();
      this.downloadValue.textContent = results.download.toFixed(2);
      this.speedValue.textContent = results.download.toFixed(2);
      this.updateGauge(results.download, 500);
      this.updateProgress(75);

      this.setActivePhase('upload');
      this.statusText.textContent = 'Тестирование отправки...';
      results.upload = await this.measureUpload();
      this.uploadValue.textContent = results.upload.toFixed(2);
      this.speedValue.textContent = results.upload.toFixed(2);
      this.updateGauge(results.upload, 100);
      this.updateProgress(100);

      this.statusText.textContent = 'Тест завершён';
    } catch (error) {
      console.error('Speedtest error:', error);
      this.statusText.textContent = 'Ошибка: ' + error.message;
    }

    this.isRunning = false;
    this.startBtn.disabled = false;
    this.setActivePhase(null);
  }

  setActivePhase(phase) {
    this.phasePing.classList.remove('active');
    this.phaseDownload.classList.remove('active');
    this.phaseUpload.classList.remove('active');
    if (phase === 'ping') this.phasePing.classList.add('active');
    if (phase === 'download') this.phaseDownload.classList.add('active');
    if (phase === 'upload') this.phaseUpload.classList.add('active');
  }

  updateProgress(percent) {
    this.progressFill.style.width = percent + '%';
  }

  updateGauge(value, maxValue = 100) {
    const percent = Math.min(value / maxValue, 1);
    const offset = 251.2 - (percent * 251.2);
    this.gaugeFill.style.strokeDashoffset = offset;
    this.speedValue.textContent = value.toFixed(2);
  }

  async measurePing() {
    const pings = [];

    for (let i = 0; i < 10; i++) {
      const start = performance.now();
      
      try {
        await fetch(`${this.apiUrl}/api/ping?t=${Date.now()}`, { 
          cache: 'no-store' 
        });
        pings.push(performance.now() - start);
      } catch (e) {
        pings.push(performance.now() - start);
      }
    }

    if (pings.length === 0) return 0;
    pings.sort((a, b) => a - b);
    return Math.round(pings[0]);
  }

  async measureDownload() {
    const startTime = performance.now();
    let totalLoaded = 0;
    let speeds = [];
    const maxGauge = 500;

    const urls = [
      `${this.apiUrl}/api/download/5mb`,
      `${this.apiUrl}/api/download/10mb`
    ];

    return new Promise((resolve) => {
      let index = 0;

      const downloadNext = () => {
        if (index >= urls.length) {
          const duration = (performance.now() - startTime) / 1000;
          const avg = duration > 0 && totalLoaded > 0 
            ? (totalLoaded * 8 / duration) / (1024 * 1024) 
            : (speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0);
          resolve(avg);
          return;
        }

        const xhr = new XMLHttpRequest();
        xhr.open('GET', urls[index] + '?t=' + Date.now(), true);
        xhr.responseType = 'blob';

        const urlStart = performance.now();

        xhr.onprogress = (e) => {
          if (e.lengthComputable) {
            const elapsed = (performance.now() - urlStart) / 1000;
            if (elapsed > 0) {
              const speed = (e.loaded * 8 / elapsed) / (1024 * 1024);
              speeds.push(speed);
              this.updateGauge(Math.min(speed, maxGauge), maxGauge);
            }
          }
        };

        xhr.onload = () => {
          if (xhr.response && xhr.response.size) {
            totalLoaded += xhr.response.size;
          }
          index++;
          downloadNext();
        };

        xhr.onerror = () => {
          index++;
          downloadNext();
        };

        xhr.send();
      };

      downloadNext();

      setTimeout(() => {
        const duration = (performance.now() - startTime) / 1000;
        const avg = duration > 0 && totalLoaded > 0 
          ? (totalLoaded * 8 / duration) / (1024 * 1024) 
          : (speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0);
        resolve(avg);
      }, 30000);
    });
  }

  async measureUpload() {
    const startTime = performance.now();
    let totalSent = 0;
    let speeds = [];
    const maxGauge = 100;

    const testBlob = new Blob([new Uint8Array(2 * 1024 * 1024)], { type: 'application/octet-stream' });

    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${this.apiUrl}/api/upload`, true);

      const uploadStart = performance.now();

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const elapsed = (performance.now() - uploadStart) / 1000;
          if (elapsed > 0) {
            const speed = (e.loaded * 8 / elapsed) / (1024 * 1024);
            speeds.push(speed);
            this.updateGauge(Math.min(speed, maxGauge), maxGauge);
          }
        }
      };

      xhr.onload = () => {
        totalSent = testBlob.size;
        finish();
      };

      xhr.onerror = () => {
        totalSent = testBlob.size;
        finish();
      };

      xhr.send(testBlob);

      const finish = () => {
        const duration = (performance.now() - startTime) / 1000;
        const avg = duration > 0 && totalSent > 0 
          ? (totalSent * 8 / duration) / (1024 * 1024) 
          : (speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0);
        resolve(avg);
      };

      setTimeout(finish, 30000);
    });
  }
}

let speedtest;
document.addEventListener('DOMContentLoaded', () => { speedtest = new Speedtest(); });

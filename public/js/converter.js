// Image and Video formats
const IMAGE_FORMATS = ['jpg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'avif'];
const VIDEO_FORMATS = ['mp4', 'webm', 'avi', 'mov', 'mkv', 'flv', 'wmv', 'm4v'];

// DOM Elements
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const converterOptions = document.getElementById('converterOptions');
const formatSelect = document.getElementById('formatSelect');
const qualitySelect = document.getElementById('qualitySelect');
const qualityGroup = document.getElementById('qualityGroup');
const convertBtn = document.getElementById('convertBtn');
const progressSection = document.getElementById('progressSection');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const resultSection = document.getElementById('resultSection');
const resultFilename = document.getElementById('resultFilename');
const resultSize = document.getElementById('resultSize');
const downloadBtn = document.getElementById('downloadBtn');
const convertAnotherBtn = document.getElementById('convertAnotherBtn');
const errorSection = document.getElementById('errorSection');
const errorMessage = document.getElementById('errorMessage');
const retryBtn = document.getElementById('retryBtn');
const deleteTimer = document.getElementById('deleteTimer');

// State
let currentFile = null;
let currentFileType = null;
let deleteInterval = null;

// Initialize
function init() {
    setupEventListeners();
}

function setupEventListeners() {
    // Upload zone click
    uploadZone.addEventListener('click', () => fileInput.click());
    
    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });
    
    // Drag and drop
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });
    
    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });
    
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });
    
    // Format select change
    formatSelect.addEventListener('change', updateQualityOptions);
    
    // Convert button
    convertBtn.addEventListener('click', handleConvert);
    
    // Convert another button
    convertAnotherBtn.addEventListener('click', resetConverter);
    
    // Retry button
    retryBtn.addEventListener('click', resetConverter);
}

function handleFileSelect(file) {
    currentFile = file;
    
    // Determine file type
    const ext = getFileExtension(file.name).toLowerCase();
    const isImage = IMAGE_FORMATS.includes(ext);
    const isVideo = VIDEO_FORMATS.includes(ext);
    
    if (!isImage && !isVideo) {
        showError('Unsupported file format');
        return;
    }
    
    currentFileType = isImage ? 'image' : 'video';
    
    // Update UI
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = formatFileSize(file.size);
    
    // Populate format options
    populateFormatOptions(isImage ? IMAGE_FORMATS : VIDEO_FORMATS, ext);
    
    // Show options
    uploadZone.style.display = 'none';
    converterOptions.style.display = 'block';
}

function getFileExtension(filename) {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function populateFormatOptions(formats, currentFormat) {
    formatSelect.innerHTML = '';
    
    formats.forEach(format => {
        const option = document.createElement('option');
        option.value = format;
        option.textContent = format.toUpperCase();
        if (format !== currentFormat) {
            formatSelect.appendChild(option);
        }
    });
    
    updateQualityOptions();
}

function updateQualityOptions() {
    const format = formatSelect.value;
    const isVideo = VIDEO_FORMATS.includes(format);
    qualityGroup.style.display = isVideo ? 'block' : 'none';
}

async function handleConvert() {
    if (!currentFile) return;
    
    const format = formatSelect.value;
    const quality = qualitySelect.value;
    
    // Show progress
    converterOptions.style.display = 'none';
    progressSection.style.display = 'block';
    progressFill.style.width = '30%';
    progressText.textContent = 'Uploading...';
    
    const formData = new FormData();
    formData.append('file', currentFile);
    formData.append('format', format);
    formData.append('quality', quality);
    
    const endpoint = currentFileType === 'image' 
        ? '/api/convert/image' 
        : '/api/convert/video';
    
    try {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 30);
                progressFill.style.width = `${percent}%`;
            }
        });
        
        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                const result = JSON.parse(xhr.responseText);
                progressFill.style.width = '100%';
                setTimeout(() => {
                    showResult(result);
                }, 500);
            } else {
                let errorMsg = 'Conversion failed';
                try {
                    const error = JSON.parse(xhr.responseText);
                    errorMsg = error.error || errorMsg;
                } catch (e) {}
                showError(errorMsg);
            }
        });
        
        xhr.addEventListener('error', () => {
            showError('Network error. Please try again.');
        });
        
        xhr.open('POST', endpoint);
        xhr.send(formData);
        
    } catch (error) {
        console.error('Conversion error:', error);
        showError('Conversion failed');
    }
}

function showResult(result) {
    progressSection.style.display = 'none';
    resultSection.style.display = 'block';
    
    resultFilename.textContent = result.filename;
    resultSize.textContent = formatFileSize(result.size);
    downloadBtn.href = result.downloadUrl;
    
    // Start delete timer
    startDeleteTimer(300); // 5 minutes in seconds
}

function startDeleteTimer(seconds) {
    let remaining = seconds;
    
    updateTimerDisplay(remaining);
    
    deleteInterval = setInterval(() => {
        remaining--;
        updateTimerDisplay(remaining);
        
        if (remaining <= 0) {
            clearInterval(deleteInterval);
        }
    }, 1000);
}

function updateTimerDisplay(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    deleteTimer.textContent = `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function showError(message) {
    progressSection.style.display = 'none';
    errorSection.style.display = 'block';
    errorMessage.textContent = message;
}

function resetConverter() {
    currentFile = null;
    currentFileType = null;
    
    if (deleteInterval) {
        clearInterval(deleteInterval);
        deleteInterval = null;
    }
    
    fileInput.value = '';
    uploadZone.style.display = 'block';
    converterOptions.style.display = 'none';
    progressSection.style.display = 'none';
    resultSection.style.display = 'none';
    errorSection.style.display = 'none';
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);

const welcomeTexts = [
    'Welcome',
    'Добро пожаловать',
    'Bienvenido',
    'Bienvenue',
    'Willkommen',
    'Benvenuto',
    'ようこそ',
    '欢迎',
    '환영합니다',
    'مرحبا',
    'Bem-vindo',
    'Witamy'
];

let currentIndex = 0;
const welcomeSpan = document.getElementById('welcomeSpan');

if (welcomeSpan) {
    function changeText() {
        welcomeSpan.style.opacity = 0;
        
        setTimeout(() => {
            currentIndex = (currentIndex + 1) % welcomeTexts.length;
            welcomeSpan.textContent = welcomeTexts[currentIndex];
            welcomeSpan.style.opacity = 1;
        }, 500);
    }
    
    setInterval(changeText, 2500);
}

// Загрузка header компонента
fetch('components/header.html')
  .then(response => response.text())
  .then(html => {
    document.getElementById('header-container').innerHTML = html;
    
    // Инициализация ASCII логотипа
    const container = document.getElementById('logo-container');
    const asciiLogo = '       __          ______                   __        __     \n' +
      '  ____/ /__ _   __/ __/ /___ _      _______/ /_____ _/ /____ \n' +
      ' / __  / _ \\ | / / /_/ / __ \\ | /| / / ___/ __/ __ `/ __/ _ \\ \n' +
      '/ /_/ /  __/ |/ / __/ / /_/ / |/ |/ (__  ) /_/ /_/ / /_/  __/ \n' +
      '\\__,_/\\___/|___/_/ /_/\\____/|__/|__/____/\\__/\\__,_/\\__/\\___/ ';
    
    if (container) {
      container.textContent = asciiLogo;
    }
  })
  .catch(err => console.error('Error loading header:', err));

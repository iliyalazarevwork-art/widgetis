// source: https://kivagro.com.ua/
// extracted: 2026-05-07T21:21:43.652Z
// scripts: 1

// === script #1 (length=1357) ===
function setPopupSize() {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      // Базовые размеры при 1600x900
      const baseWidth = 1600;
      const baseHeight = 900;
      const popupBaseWidth = 500;
      const popupBaseHeight = 200;

      // Рассчитываем коэффициент масштабирования
      const scale = Math.min(screenWidth / baseWidth, screenHeight / baseHeight);

      const newWidth = popupBaseWidth * scale;
      const newHeight = popupBaseHeight * scale;

      const popup = document.getElementById('popup');

      // Для мобильных устройств медиа-запросы уже сработают, поэтому здесь только для десктопа
      if (screenWidth > 768) {
        popup.style.width = newWidth + 'px';
        popup.style.height = 'auto';
      } else {
        popup.style.width = 'auto'; // Отдадим контроль медиа-запросам
      }
    }

    function showPopup() {
      if (!sessionStorage.getItem('popupShown')) {
        setPopupSize();
        document.getElementById('popup').style.display = 'block';
        sessionStorage.setItem('popupShown', 'true');
      }
    }

    function closePopup() {
      document.getElementById('popup').style.display = 'none';
    }

    window.addEventListener('load', showPopup);
    window.addEventListener('resize', setPopupSize);

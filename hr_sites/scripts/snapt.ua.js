// source: https://snapt.ua/
// extracted: 2026-05-07T21:19:05.722Z
// scripts: 3

// === script #1 (length=916) ===
(function() {
	  const currentUrl = window.location.href;
	  const result = currentUrl.match(/\/ru\//);
	
	  if (result[0] == '/ru/') {
	    const page = document.querySelector('#page');
	    const container = page ? page : document.body;
	
	    const str = `
	      <div class="container js-banner-container" style="min-height: 0;">
	        <div class="ribbon-banner ribbon-banner--height-m j-ribbon-banner">
	          <div class="ribbon-banner__container" style="background: #ff0000">
	            <div class="ribbon-banner__text" style="color: #ffffff;">
	              Ви зараз на російській версії сайту. Для переходу на українську натисніть <a href="${currentUrl.replace(/\/ru\//, '/')}" style="color: #fff; text-decoration: underline;">тут</a>!
	            </div>
	          </div>
	        </div>
	      </div>
	    `;
	    container.insertAdjacentHTML('afterbegin', str);
	  }
	}());

// === script #2 (length=1051) ===
const mmToPx = mm => mm * 3.78;

  function moveRingostatButton() {
    const btn = document.querySelector('.rngst_phone_button');
    if (btn) {
      btn.style.position = "fixed";
      btn.style.zIndex = "99999";

      if (window.innerWidth <= 768) {
        // 📱 мобільна версія
        btn.style.bottom = mmToPx(20) + "px"; 
        btn.style.right  = mmToPx(-12) + "px"; 
        btn.style.transform = "scale(0.7)"; // зменшуємо діаметр (наприклад, 80%)
      } else {
        // 💻 десктопна версія
        btn.style.bottom = mmToPx(28) + "px"; 
        btn.style.right  = mmToPx(-10) + "px"; 
        btn.style.transform = "scale(1.0)"; // трішки менший ніж оригінал (90%)
      }

      btn.style.transformOrigin = "center"; // щоб масштабування йшло від центру
    } else {
      setTimeout(moveRingostatButton, 500); // якщо ще не зʼявився – чекаємо
    }
  }

  // запускаємо одразу
  moveRingostatButton();

  // перезапуск при зміні розміру екрану
  window.addEventListener('resize', moveRingostatButton);

// === script #3 (length=581) ===
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

  ga('create', 'G-D1GZQ99JP2', 'auto');
  ga('require', 'ec');
  ga('set', '&cu', GLOBAL.currency.iso);

   // заменяется кодом инициализации события с расположением "Внутри кода инициализации маркетинговой системы"
  
  ga('send', 'pageview');

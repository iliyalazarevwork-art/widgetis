// source: https://nishenka.com.ua/
// extracted: 2026-05-07T21:22:11.863Z
// scripts: 1

// === script #1 (length=1386) ===
function loadFonts() {
      const MONTSERRAT_ALTERNATES_HREF = 'https://fonts.googleapis.com/css2?family=Montserrat+Alternates:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap';
      const RALEWAY_HREF = 'https://fonts.googleapis.com/css2?family=Raleway:ital,wght@0,100..900;1,100..900&display=swap';
      const OPEN_SANS_HREF = 'https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap';

      const params = [
         { rel: 'preconnect', href: 'https://fonts.googleapis.com' }, 
         { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true },
         { rel: 'stylesheet', href: OPEN_SANS_HREF },
      ];

      const head = document.querySelector('head');

      params.forEach(param => {
         const link = document.createElement('link');
         link.setAttribute('rel', param.rel);
         link.setAttribute('href', param.href);

         if (param.crossorigin) {
            link.setAttribute('crossorigin', true);
         }

         head.appendChild(link);
      });
   }

   function setImageUndraggable() {
      setTimeout(() => {
         document.querySelector('.header__logo > img').setAttribute('draggable', 'false');
      }, 3000);
   }

   loadFonts();
   setImageUndraggable();

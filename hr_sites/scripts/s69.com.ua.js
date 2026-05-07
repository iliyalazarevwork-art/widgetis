// source: https://s69.com.ua/
// extracted: 2026-05-07T21:19:16.977Z
// scripts: 1

// === script #1 (length=1114) ===
(function () {
    const lang = document.documentElement.lang || 'uk';
    const fetchUrl = lang === 'ru' ? 'https://s69.com.ua/ru/' : 'https://s69.com.ua';

    fetch(fetchUrl, {
      mode: 'cors',
      cache: 'force-cache',
      headers: {
        Accept: 'text/html',
      },
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Error data: ${response.status}`);
        }
        return response.text();
      })
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const bannerImageDiv = doc.querySelector('.banners-group .banner');
        if (!bannerImageDiv) {
          return;
        }
        const bannerContent = bannerImageDiv.outerHTML;
        const mainBannerContainer = document.querySelector('.main_banner');
        if (!mainBannerContainer) {
          return;
        }
        mainBannerContainer.innerHTML = bannerContent;
      })
      .catch(error => {
        console.error('Error loading banner:', error.message);
      });
  })();

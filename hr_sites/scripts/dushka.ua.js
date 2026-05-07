// source: https://dushka.ua/
// extracted: 2026-05-07T21:19:12.979Z
// scripts: 1

// === script #1 (length=4951) ===
class LanguageService {
        constructor() {
          this.init();
        }

        modalOverlay = document.createElement('DIV');
        modalContent = document.createElement('DIV');

        ruLink;
        ukrLink;
        close;

        locales = {
          UKR: 'uk',
          RU: 'ru',
        };

        currentHref = window.location.href;

        localStorageKey = 'preferred-lang';
        preferredLang = window.localStorage.getItem(this.localStorageKey);

        init() {
          this.buildOverlay();
          this.buildContent();
          this.buildControls();

          if (!this.preferredLang) {
            this.appendLangModel();
          } else {
            this.redirectToPreferredLang();
          }

          this.listenNativeSwitcher();
        }

        buildContent() {
          const html = `
        <div class="lang-picker">
          <p><b>ПІДТРИМУЙ УКРАЇНСЬКЕ!</b></p>
          <p>Оберіть бажану мову сайту:</p>
          <a class="lang-ukr" data-lang="${this.locales.UKR}" href="#">УКР</a>
          <a class="lang-ru" data-lang="${this.locales.RU}" href="#">РУС</a>
          <i class="lang-model-close">&#10006;</i>
        </div>
      `;

          this.modalContent.innerHTML = html;
          this.modalContent.classList.add('lang-picker-wrapper');

          this.modalOverlay.appendChild(this.modalContent);
        }

        buildOverlay() {
          this.modalOverlay.classList.add('lang-overlay');
        }

        appendLangModel() {
          document.body.appendChild(this.modalOverlay);
        }

        buildControls() {
          this.ruLink = this.modalContent.querySelector('.lang-ru');
          this.ukrLink = this.modalContent.querySelector('.lang-ukr');
          this.close = this.modalContent.querySelector('.lang-model-close');

          [this.ruLink, this.ukrLink].forEach((link) => {
            link.addEventListener('click', () => {
              this.onLinkClick(link);
            });
          });

          this.close.addEventListener('click', () => {
            this.closeModal();
          });
        }

        onLinkClick(link) {
          const lang = link.getAttribute('data-lang');
          const curLang = this.getCurrentHrefLocale();
          let newUrl = this.constructNewUrl(lang);

          this.setPreferredLang(lang);

          this.redirectToPreferredLang();
        }

        closeModal() {
          if(document.body.contains(this.modalOverlay)) {
            document.body.removeChild(this.modalOverlay);
          }
        }

        getCurrentHrefLocale() {
          return this.currentHref.includes('/ru/')
            ? this.locales.RU
            : this.locales.UKR;
        }

        setPreferredLang(lang) {
          window.localStorage.setItem(this.localStorageKey, lang);
          this.preferredLang = lang;
        }

        redirectToPreferredLang() {
          const hrefLocale = this.getCurrentHrefLocale();
          let newHref = this.constructNewUrl(this.preferredLang);

          if (newHref && newHref !== this.currentHref) {
            window.location.replace(newHref);
          } else {
            this.closeModal()
          }
        }

        constructNewUrl(lang) {
          if (lang === this.locales.RU) {
            if (!this.currentHref.includes(this.locales.RU)) {
              return this.currentHref.replace(/dushka.ua/, 'dushka.ua/ru');
            } else {
              return this.currentHref;
            }
          }

          if (lang === this.locales.UKR) {
            return this.currentHref.replace(/dushka.ua\/ru/, 'dushka.ua');
          }

          return this.curentHref;
        }

        listenNativeSwitcher() {
          window.addEventListener('load', (event) => {
            const nativeLangSelectors = Array.from(
              document.body.querySelectorAll('.lang-menu__item, .lang-switcher__link, .localization-menu__item')
            );

            nativeLangSelectors.forEach((selector) => {
              selector.addEventListener('click', (event) => {
                const nativeSwitcherHref = event.target.href;
                let nativeSwitcherPickedLang;

                if (nativeSwitcherHref) {
                  if (nativeSwitcherHref.includes(`/${this.locales.RU}/`)) {
                    nativeSwitcherPickedLang = this.locales.RU;
                  } else {
                    nativeSwitcherPickedLang = this.locales.UKR;
                  }
                }

                if (nativeSwitcherPickedLang) {
                  this.setPreferredLang(nativeSwitcherPickedLang);
                }
              });
            });
          });
        }
      }

      //if (window.localStorage.getItem('lang-debug-mode')) {
        const modal = new LanguageService();
      //}

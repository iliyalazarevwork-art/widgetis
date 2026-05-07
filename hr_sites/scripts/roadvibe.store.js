// source: https://roadvibe.store/
// extracted: 2026-05-07T21:22:29.906Z
// scripts: 4

// === script #1 (length=6224) ===
// This function will handle the initialization once the DOM is fully loaded.
document.addEventListener("DOMContentLoaded", function() {
    initializeReviewContents();
    setupReviewContentReloading();
});

// This function will process each review content found in the DOM.
function initializeReviewContents() {
    const reviewContents = document.querySelectorAll('[itemprop="reviewBody"]');
    reviewContents.forEach(processReviewContent);

const reviewComentsCarousel = document.querySelectorAll('.review-item__text, .review-item__body');
 reviewComentsCarousel.forEach(processReviewContent);
}

// This function will process individual review content, modifying inner HTML to replace placeholders with images.
function processReviewContent(content) {
    let innerHTML = content.innerHTML;
    const regex = /\[([^[\]]+)\]/g;

    innerHTML = innerHTML.replace(regex, replaceUrlWithImage);

    content.innerHTML = innerHTML;
}

// This function is a replacement function for the String.prototype.replace() method, transforming URLs into image elements.
function replaceUrlWithImage(match, url) {
    url = url.replace(/\s+/g, '');

    if (!url.match(/^https?:\/\//)) {
        url = "http://" + url;
    }

//return '<img loading="lazy" src="' + url + '" style="max-width:100%; max-height:100px; display:block; cursor:pointer;" class="review-image-thumbnail" onclick="showModal(\'' + url + '\')">';
return '<div class="review-image-thumbnail-wrapper"><img loading="lazy" src="' + url + '" style="max-width:100%; max-height:100px; display:block; cursor:pointer;" class="review-image-thumbnail" onclick="showModal(\'' + url + '\')"></div>';
}

// This function creates and shows a modal when an image is clicked.
window.showModal = function(url) {
    const modal = createModal();
    const modalContent = createModalContent(url);
    modal.appendChild(modalContent);

    document.body.appendChild(modal);
};

// This function creates the backdrop for the modal.
function createModal() {
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1050; overflow: auto;';
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            document.body.removeChild(modal);
        }
    });
    return modal;
}

// This function creates the content of the modal, including the image and close button.
function createModalContent(url) {
    const modalContent = document.createElement('div');
    modalContent.style.cssText = 'background-color: white; padding: 20px; border-radius: 5px; position: relative; max-width: 90%; box-shadow: 0 4px 8px rgba(0,0,0,0.2);     max-height: 80%;';

    const closeButton = createCloseButton();
    modalContent.appendChild(closeButton);

    const modalImg = document.createElement('img');
    modalImg.src = url;
    modalImg.style.cssText = 'max-width: 100%; max-height: 50vh;';
    modalContent.appendChild(modalImg);

    return modalContent;
}

// This function creates a button to close the modal.
function createCloseButton() {
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
   closeButton.style.cssText = 'position: absolute; top: 10px; right: 15px; border: none; background: none; font-size: 50px; cursor: pointer; color: red;'; 
    closeButton.addEventListener('click', function() {
        const modal = this.closest('div[style*="position: fixed"]');
        document.body.removeChild(modal);
    });
    return closeButton;
}

function setupDelegatedReviewButtonEvents() {
    const storeReviewButtons = document.querySelector('.store-reviews__button');
    const showMoreContainer = document.querySelector('.store-reviews__show-more');

    if (storeReviewButtons) {
        storeReviewButtons.addEventListener('click', function(event) {
            // Перевіряємо, чи клік був зроблений саме на елементі span з класом btn__text j-text
            if (event.target.classList.contains('btn__text') && event.target.classList.contains('j-text')) {
                if (!isChecking) {
                    startPeriodicCheck();
                }
            }
        });
    }

    if (showMoreContainer) {
        showMoreContainer.addEventListener('click', function(event) {
            if (event.target.classList.contains('btn-content')) {
                if (!isChecking) {
                    startPeriodicCheck();
                }
            }
        });
    }
}

let isChecking = false; 


function setupReviewContentReloading() {
  
    const showMoreButtons = document.querySelectorAll('.store-reviews__show-more .btn');
 
    showMoreButtons.forEach(button => {
        button.addEventListener('click', () => {
          startPeriodicCheck();
        });
    });

    const storeReviewButtons = document.querySelectorAll('.store-reviews__button span');
   
    storeReviewButtons.forEach(span => {
        span.addEventListener('click', () => {
            startPeriodicCheck();
        });
    });

   const productReviewButtons = document.querySelectorAll('.reviews-load-link');
   
    productReviewButtons.forEach(span => {
        span.addEventListener('click', () => {
            startPeriodicCheck();
        });
    });

    const showMoreButtonsMobile = document.querySelectorAll('.reviews__button span');
   
    showMoreButtonsMobile.forEach(span => {
        span.addEventListener('click', () => {
            startPeriodicCheck();
        });
    });
}


function startPeriodicCheck() {
    isChecking = true; 
    const initialCount = document.querySelectorAll('[itemprop="reviewBody"]').length;

    const intervalId = setInterval(() => {
        const currentCount = document.querySelectorAll('[itemprop="reviewBody"]').length;
        if (currentCount > initialCount) {
            initializeReviewContents();
            clearInterval(intervalId);
            isChecking = false; 
        }
    }, 1000);
}

// === script #2 (length=4506) ===
document.addEventListener("DOMContentLoaded", () => {
  const isMobile = () =>
    window.innerWidth <= 800 ||
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const loadCloudflareStreamSDK = (callback) => {
    const loadScript = () => {
      const script = document.createElement("script");
      script.src = "https://embed.cloudflarestream.com/embed/sdk.latest.js";
      script.onload = callback;
      document.head.append(script);
    };
    if ("requestIdleCallback" in window)
      requestIdleCallback(loadScript, { timeout: 2000 });
    else loadScript();
  };

  const initializePlayer = (iframe) => Stream(iframe);

  const loadVideoOnVisibilityChange = () => {
    const videoItems = document.querySelectorAll('.gallery__item--video');
    const players = new Map();

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const container = entry.target;
        const iframe = container.querySelector('iframe');
        if (!iframe) return;

        if (entry.isIntersecting) {
          if (iframe.dataset.src) {
         
            if (!container.querySelector('.video-loader')) {
              const loader = document.createElement('div');
              loader.className = 'video-loader';
              container.appendChild(loader);
            }
            iframe.src = iframe.dataset.src;
            delete iframe.dataset.src;
            iframe.addEventListener('load', () => {
              const loader = container.querySelector('.video-loader');
              if (loader) loader.remove();
            }, { once: true });
          
            const overlay = document.createElement('div');
            overlay.className = 'gallery__video-overlay j-video-overlay-1';
            overlay.style.cssText =
              "touch-action: pan-y; user-select: none; -webkit-user-drag: none; -webkit-tap-highlight-color: rgba(0, 0, 0, 0);";
            iframe.insertAdjacentElement('afterend', overlay);
            const player = initializePlayer(iframe);
            players.set(container, player);
            overlay.addEventListener('click', () => {
              if (player.paused) {
              
                overlay.innerHTML = "";
                if (!container.querySelector('.video-loader')) {
                  const loader = document.createElement('div');
                  loader.className = 'video-loader';
                  container.appendChild(loader);
                }
                player.play();
                setTimeout(() => {
                  const loader = container.querySelector('.video-loader');
                  if (loader) loader.remove();
                }, 500);
              } else {
              
                player.pause();
                overlay.innerHTML = '<span class="custom-pause-icon"></span>';
              }
            });
          } else {
            const player = players.get(container);
            if (player) {
              const overlay = container.querySelector('.j-video-overlay-1');
              if (overlay && !overlay.hasAttribute('data-click-bound')) {
                overlay.addEventListener('click', () => {
                  if (player.paused) {
                    overlay.innerHTML = "";
                    if (!container.querySelector('.video-loader')) {
                      const loader = document.createElement('div');
                      loader.className = 'video-loader';
                      container.appendChild(loader);
                    }
                    player.play();
                    setTimeout(() => {
                      const loader = container.querySelector('.video-loader');
                      if (loader) loader.remove();
                    }, 500);
                  } else {
                    player.pause();
                    overlay.innerHTML = '<span class="custom-pause-icon"></span>';
                  }
                });
                overlay.setAttribute('data-click-bound', 'true');
              }
            }
          }
        } else {
          const player = players.get(container);
          if (player && !player.paused) player.pause();
        }
      });
    }, { root: null, rootMargin: '0px', threshold: 0.05 });

    videoItems.forEach((item) => observer.observe(item));
  };

  if (isMobile()) loadCloudflareStreamSDK(loadVideoOnVisibilityChange);
});

// === script #3 (length=2669) ===
const widget = document.querySelector('[data-widget]');
    const toggle = widget.querySelector('.contact-toggle');
    const links = widget.querySelectorAll('.contact-link');
    const hint = widget.querySelector('[data-hint]');
    const SHOW_DELAY_MS = 10000;
    const HINT_VISIBLE_MS = 10000;
    const HINT_STORAGE_KEY = 'contact_widget_hint_dismissed';
    let hintShowTimer = null;
    let hintHideTimer = null;

    function setOpen(value) {
        widget.classList.toggle('open', value);
        toggle.setAttribute('aria-expanded', String(value));
    }

    function dismissHint(store) {
        if (hintShowTimer) {
            clearTimeout(hintShowTimer);
            hintShowTimer = null;
        }
        if (hintHideTimer) {
            clearTimeout(hintHideTimer);
            hintHideTimer = null;
        }
        widget.classList.remove('hint-visible');
        if (store) {
            try {
                localStorage.setItem(HINT_STORAGE_KEY, '1');
            } catch (_) {
            }
        }
    }

    function toggleWidget() {
        const willOpen = !widget.classList.contains('open');
        setOpen(willOpen);
        dismissHint(true);
    }

    toggle.addEventListener('click', (event) => {
        event.stopPropagation();
        toggleWidget();
    });

    if (hint) {
        hint.addEventListener('click', (event) => {
            event.stopPropagation();
            setOpen(true);
            dismissHint(true);
        });
    }

    document.addEventListener('click', (event) => {
        if (!widget.contains(event.target)) {
            setOpen(false);
        }
    });

    links.forEach((link) => {
        link.addEventListener('click', () => {
            setOpen(false);
            dismissHint(true);
        });
    });

    function scheduleHint() {
        if (!hint) {
            return;
        }
        let blocked = false;
        try {
            blocked = localStorage.getItem(HINT_STORAGE_KEY) === '1';
        } catch (_) {
            blocked = true;
        }
        if (blocked) {
            return;
        }
        hintShowTimer = window.setTimeout(() => {
            if (!widget.classList.contains('open')) {
                widget.classList.add('hint-visible');
                hintHideTimer = window.setTimeout(() => {
                    dismissHint(true);
                }, HINT_VISIBLE_MS);
            }
        }, SHOW_DELAY_MS);
    }

    if (location.pathname.toLowerCase().includes('checkout')) {
        if (widget) widget.remove();
    } else {
        scheduleHint();
    }

// === script #4 (length=902) ===
(function(){function c(){var b=a.contentDocument||a.contentWindow.document;if(b){var d=b.createElement('script');d.innerHTML="window.__CF$cv$params={r:'9f8347c659823294',t:'MTc3ODE4ODk0OQ=='};var a=document.createElement('script');a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';document.getElementsByTagName('head')[0].appendChild(a);";b.getElementsByTagName('head')[0].appendChild(d)}}if(document.body){var a=document.createElement('iframe');a.height=1;a.width=1;a.style.position='absolute';a.style.top=0;a.style.left=0;a.style.border='none';a.style.visibility='hidden';document.body.appendChild(a);if('loading'!==document.readyState)c();else if(window.addEventListener)document.addEventListener('DOMContentLoaded',c);else{var e=document.onreadystatechange||function(){};document.onreadystatechange=function(b){e(b);'loading'!==document.readyState&&(document.onreadystatechange=e,c())}}}})();

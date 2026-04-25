import {
  photoReviewsSchema,
  photoReviewsI18nSchema,
  type PhotoReviewsInput,
  type PhotoReviewsConfig,
} from './schema';
import { getLanguage, isHoroshopProductPage } from '@laxarevii/core';
import GLightbox from 'glightbox';
import glightboxCss from 'glightbox/dist/css/glightbox.min.css?inline';

const STYLE_ID = 'hs-photo-reviews-styles';
const GLB_STYLE_ID = 'hs-photo-reviews-glb-styles';
const PROCESSED_ATTR = 'data-hs-photo-reviews';
const GALLERY_CLASS = 'hs-photo-review__gallery';
const SLIDE_CLASS = 'hs-photo-review__slide';
const BADGE_CLASS = 'hs-photo-review__badge';
const PLAY_CLASS = 'hs-photo-review__play';
const MOBILE_BREAKPOINT = 768;
const OBSERVER_DEBOUNCE_MS = 150;
const VIDEO_EXT_RE = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i;

type I18n = {
  viewPhotoLabel: string;
  closeLabel: string;
  prevLabel: string;
  nextLabel: string;
};

type ResolvedSettings = PhotoReviewsConfig & I18n;
type MediaKind = 'image' | 'video';

let settings: ResolvedSettings | null = null;
let observer: MutationObserver | null = null;
let syncTimer: number | null = null;

function isMobileViewport(): boolean {
  return window.innerWidth <= MOBILE_BREAKPOINT;
}

function shouldShowForViewport(s: ResolvedSettings): boolean {
  return isMobileViewport() ? s.showOnMobile : s.showOnDesktop;
}


function detectKind(url: string): MediaKind {
  return VIDEO_EXT_RE.test(url) ? 'video' : 'image';
}

function ensureStyles(s: ResolvedSettings): void {
  if (!document.getElementById(GLB_STYLE_ID)) {
    const glb = document.createElement('style');
    glb.id = GLB_STYLE_ID;
    glb.textContent = `${glightboxCss}
.glightbox-clean .gclose,.glightbox-clean .gprev,.glightbox-clean .gnext{background:rgba(0,0,0,0.5)!important}
.glightbox-clean .gclose svg,.glightbox-clean .gprev svg,.glightbox-clean .gnext svg{fill:#fff!important}
.gslider{touch-action:pan-y}
.gslide-video video{max-height:calc(100vh - 60px);border-radius:12px}`;
    document.head.appendChild(glb);
  }

  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .${GALLERY_CLASS}{
      display:flex;
      gap:10px;
      overflow-x:auto;
      overflow-y:hidden;
      scroll-snap-type:x mandatory;
      -webkit-overflow-scrolling:touch;
      scrollbar-width:none;
      padding:12px 0 6px;
      margin:10px -4px 4px;
    }
    .${GALLERY_CLASS}::-webkit-scrollbar{display:none}
    .${GALLERY_CLASS}.is-single{
      overflow:visible;
      scroll-snap-type:none;
    }
    .${SLIDE_CLASS}{
      flex:0 0 78%;
      max-width:320px;
      min-width:0;
      scroll-snap-align:start;
      position:relative;
      border-radius:${s.borderRadius}px;
      overflow:hidden;
      background:#0b0b0b;
      box-shadow:0 4px 14px rgba(17,24,39,0.08);
      cursor:zoom-in;
      -webkit-tap-highlight-color:transparent;
      transition:transform 0.2s ease-out;
      padding:0;
      border:none;
      color:inherit;
      font:inherit;
    }
    .${GALLERY_CLASS}.is-single .${SLIDE_CLASS}{
      flex:1 1 auto;
      max-width:420px;
    }
    .${SLIDE_CLASS}:first-child{margin-left:4px}
    .${SLIDE_CLASS}:last-child{margin-right:4px}
    .${SLIDE_CLASS}:active{transform:scale(0.98)}
    .${SLIDE_CLASS} img,
    .${SLIDE_CLASS} video{
      display:block;
      width:100%;
      height:100%;
      object-fit:cover;
      aspect-ratio:${s.aspectRatio};
      pointer-events:none;
    }
    .${BADGE_CLASS}{
      position:absolute;
      left:10px;
      bottom:10px;
      display:inline-flex;
      align-items:center;
      gap:6px;
      padding:6px 10px;
      border-radius:999px;
      background:rgba(17,24,39,0.72);
      color:#fff;
      font:500 12px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
      backdrop-filter:blur(4px);
      pointer-events:none;
    }
    .${BADGE_CLASS} svg{
      width:14px;
      height:14px;
      flex:0 0 14px;
    }
    .${PLAY_CLASS}{
      position:absolute;
      top:50%;
      left:50%;
      transform:translate(-50%,-50%);
      width:58px;
      height:58px;
      border-radius:999px;
      background:rgba(255,255,255,0.95);
      color:#111827;
      display:flex;
      align-items:center;
      justify-content:center;
      pointer-events:none;
      box-shadow:0 6px 18px rgba(0,0,0,0.35);
    }
    .${PLAY_CLASS} svg{
      width:22px;
      height:22px;
      margin-left:3px;
    }
    @media (min-width:${MOBILE_BREAKPOINT + 1}px){
      .${SLIDE_CLASS}{flex-basis:260px;max-width:260px}
      .${GALLERY_CLASS}.is-single .${SLIDE_CLASS}{max-width:320px}
    }
    @media (prefers-reduced-motion:reduce){
      .${SLIDE_CLASS}{transition:none}
    }
  `;
  document.head.appendChild(style);
}

function getText(review: HTMLElement, selector: string): string {
  const el = review.querySelector<HTMLElement>(selector);
  return (el?.textContent ?? '').trim().toLowerCase();
}

function resolveUrls(
  review: HTMLElement,
  s: ResolvedSettings,
): { urls: string[]; alt: string } | null {
  const author = getText(review, s.authorSelector);
  const body = getText(review, s.bodySelector);

  for (const entry of s.photos) {
    if (entry.author && author.includes(entry.author.trim().toLowerCase())) {
      return { urls: entry.urls, alt: entry.alt || s.viewPhotoLabel };
    }
    if (entry.contains && body.includes(entry.contains.trim().toLowerCase())) {
      return { urls: entry.urls, alt: entry.alt || s.viewPhotoLabel };
    }
  }

  if (s.fallbackUrls.length > 0) {
    return { urls: s.fallbackUrls, alt: s.viewPhotoLabel };
  }
  return null;
}

function buildPlayIcon(): HTMLSpanElement {
  const wrap = document.createElement('span');
  wrap.className = PLAY_CLASS;
  wrap.innerHTML =
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
  return wrap;
}

function buildBadge(text: string, kind: MediaKind): HTMLSpanElement {
  const badge = document.createElement('span');
  badge.className = BADGE_CLASS;
  const icon =
    kind === 'video'
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="14" height="14" rx="2"/><path d="M21 7l-4 4 4 4z"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10.5" r="1.5"/><path d="M21 16l-5-5L5 21"/></svg>';
  badge.innerHTML = `${icon}<span>${text}</span>`;
  return badge;
}

function buildSlideMedia(url: string, alt: string): {
  element: HTMLElement;
  kind: MediaKind;
} {
  const kind = detectKind(url);

  if (kind === 'video') {
    const video = document.createElement('video');
    video.src = url;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('playsinline', 'playsinline');
    video.setAttribute('webkit-playsinline', 'true');
    video.preload = 'metadata';
    video.controls = false;
    video.setAttribute('aria-label', alt);
    return { element: video, kind };
  }

  const img = document.createElement('img');
  img.src = url;
  img.alt = alt;
  img.loading = 'lazy';
  img.decoding = 'async';
  return { element: img, kind };
}

function buildGallery(urls: string[], alt: string, s: ResolvedSettings): HTMLElement {
  const gallery = document.createElement('div');
  gallery.className = GALLERY_CLASS;
  if (urls.length === 1) gallery.classList.add('is-single');

  urls.forEach((url, idx) => {
    const slide = document.createElement('button');
    slide.type = 'button';
    slide.className = SLIDE_CLASS;
    slide.setAttribute('aria-label', s.viewPhotoLabel);

    const { element, kind } = buildSlideMedia(url, alt);
    slide.appendChild(element);

    if (kind === 'video') {
      slide.appendChild(buildPlayIcon());
    }

    if (idx === 0) {
      const countLabel =
        urls.length > 1 ? `${s.viewPhotoLabel} · 1/${urls.length}` : s.viewPhotoLabel;
      slide.appendChild(buildBadge(countLabel, kind));
    }

    if (s.openInLightbox) {
      slide.addEventListener('click', (event) => {
        event.preventDefault();
        openLightbox(urls, alt, idx);
      });
    }

    gallery.appendChild(slide);
  });

  return gallery;
}

type GLightboxElement = {
  href?: string;
  content?: string;
  type: 'image' | 'inline';
  alt?: string;
  width?: string;
  height?: string;
};

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildElements(urls: string[], alt: string): GLightboxElement[] {
  return urls.map((url) => {
    if (detectKind(url) === 'video') {
      const src = escapeAttr(url);
      const label = escapeAttr(alt);
      return {
        content:
          `<div class="hs-glb-video" style="display:flex;align-items:center;justify-content:center;width:min(96vw,720px);max-height:calc(100vh - 80px);">` +
          `<video src="${src}" controls autoplay playsinline preload="metadata" aria-label="${label}" ` +
          `style="max-width:100%;max-height:calc(100vh - 80px);width:auto;height:auto;border-radius:12px;background:#000;box-shadow:0 12px 40px rgba(0,0,0,0.5)">` +
          `</video></div>`,
        type: 'inline',
        width: 'auto',
        height: 'auto',
      };
    }
    return { href: url, type: 'image', alt };
  });
}

function openLightbox(urls: string[], alt: string, index: number): void {
  const lb = GLightbox({
    elements: buildElements(urls, alt),
    startAt: Math.max(0, Math.min(index, urls.length - 1)),
    loop: urls.length > 1,
    touchNavigation: true,
    keyboardNavigation: true,
    closeOnOutsideClick: true,
    openEffect: 'fade',
    closeEffect: 'fade',
    slideEffect: 'slide',
    preload: true,
    moreLength: 0,
  });

  lb.on('slide_changed', ({ prev }: { prev?: { slide?: HTMLElement } }) => {
    const v = prev?.slide?.querySelector?.('video');
    if (v) {
      try { v.pause(); } catch { /* */ }
    }
  });

  lb.on('close', () => {
    document
      .querySelectorAll<HTMLVideoElement>('.glightbox-container video')
      .forEach((v) => {
        try { v.pause(); } catch { /* */ }
      });
  });

  lb.open();
}

function processReviews(s: ResolvedSettings): void {
  if (!shouldShowForViewport(s)) return;
  if (!isHoroshopProductPage()) return;

  const reviews = Array.from(document.querySelectorAll<HTMLElement>(s.reviewSelector));
  if (reviews.length === 0) return;

  for (const review of reviews) {
    if (review.getAttribute(PROCESSED_ATTR) === '1') continue;

    const match = resolveUrls(review, s);
    if (!match) {
      review.setAttribute(PROCESSED_ATTR, 'skip');
      continue;
    }

    const body = review.querySelector<HTMLElement>(s.bodySelector);
    if (!body) {
      review.setAttribute(PROCESSED_ATTR, 'skip');
      continue;
    }

    const gallery = buildGallery(match.urls, match.alt, s);
    body.appendChild(gallery);
    review.setAttribute(PROCESSED_ATTR, '1');
  }
}

function scheduleSync(): void {
  if (!settings) return;
  if (syncTimer !== null) window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(() => {
    syncTimer = null;
    if (settings) processReviews(settings);
  }, OBSERVER_DEBOUNCE_MS);
}

function ensureObserver(s: ResolvedSettings): void {
  if (!s.observeDom || observer) return;
  observer = new MutationObserver(() => scheduleSync());
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('resize', scheduleSync);
}

function removeInjected(): void {
  document.querySelectorAll<HTMLElement>(`.${GALLERY_CLASS}`).forEach((el) => el.remove());
  document
    .querySelectorAll<HTMLElement>(`[${PROCESSED_ATTR}]`)
    .forEach((el) => el.removeAttribute(PROCESSED_ATTR));
}

export default function photoReviews(
  rawConfig: PhotoReviewsInput,
  rawI18n: Record<string, I18n>,
): (() => void) | void {
  if (typeof document === 'undefined') return;

  const config = photoReviewsSchema.parse(rawConfig);
  const i18nMap = photoReviewsI18nSchema.parse(rawI18n);
  if (!config.enabled) {
    console.warn('[widgetality] photo-reviews: ⚠️ disabled');
    return;
  }
  if (!isHoroshopProductPage()) {
    console.warn('[widgetality] photo-reviews: ⚠️ skipped — not a product page');
    return;
  }
  console.log('[widgetality] photo-reviews: ✅ activated');

  const lang = getLanguage();
  const i18n = i18nMap[lang] ?? i18nMap.ua ?? i18nMap.ru ?? Object.values(i18nMap)[0]!;

  settings = { ...config, ...i18n };
  ensureStyles(settings);
  ensureObserver(settings);
  processReviews(settings);

  return () => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (syncTimer !== null) {
      window.clearTimeout(syncTimer);
      syncTimer = null;
    }
    window.removeEventListener('resize', scheduleSync);
    removeInjected();
    document.getElementById(STYLE_ID)?.remove();
    document.getElementById(GLB_STYLE_ID)?.remove();
    settings = null;
  };
}

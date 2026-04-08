import {
  productVideoPreviewSchema,
  productVideoPreviewI18nSchema,
  type ProductVideoPreviewInput,
  type ProductVideoPreviewConfig,
} from './schema';
import { getLanguage } from '@laxarevii/core';
import interact from 'interactjs';

const STYLE_ID = 'hs-product-video-preview-styles';
const ROOT_ID = 'hs-product-video-preview';
const TOOLTIP_ID = 'hs-product-video-preview-tooltip';
const OVERLAY_ID = 'hs-product-video-preview-overlay';
const MOBILE_BREAKPOINT = 768;
const OBSERVER_DEBOUNCE_MS = 120;
const MIN_DRAG_DISTANCE = 6;
const SCROLL_MINIMIZE_DISTANCE = 50;
const DISMISS_ANIMATION_MS = 220;

type Edge = 'left' | 'right';

type ResolvedSettings = ProductVideoPreviewConfig & {
  tooltipText: string;
  actionButtonText: string;
  sizeGuideText: string;
  closeLabel: string;
};

type OverlayRefs = {
  backdrop: HTMLDivElement;
  closeButton: HTMLButtonElement;
  actionButton: HTMLButtonElement;
  onEscape: (event: KeyboardEvent) => void;
};

type WidgetState = {
  root: HTMLDivElement;
  video: HTMLVideoElement | HTMLIFrameElement;
  tooltip: HTMLDivElement | null;
  overlay: OverlayRefs | null;
  pageKey: string;
  videoSrc: string;
  settings: ResolvedSettings;
  edge: Edge;
  top: number;
  isMinimized: boolean;
  lastScrollTop: number;
  scrollDistance: number;
  suppressClick: boolean;
  isDestroyed: boolean;
  removeScrollListener: () => void;
  destroyDrag: () => void;
  drag: {
    active: boolean;
    pointerId: number | null;
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
    dx: number;
    dy: number;
    moved: boolean;
  };
};

let widget: WidgetState | null = null;
let observer: MutationObserver | null = null;
let syncTimer: number | null = null;
let historyPatched = typeof (window as any).__hsPvpHistoryPatched === 'boolean'
  ? (window as any).__hsPvpHistoryPatched as boolean
  : false;
let historyListenersAttached = false;
const dismissedPages = new Set<string>();

// --- Helpers ---

function isMobileViewport(): boolean {
  return window.innerWidth <= MOBILE_BREAKPOINT;
}

function shouldShowForViewport(settings: ResolvedSettings): boolean {
  return isMobileViewport() ? settings.showOnMobile : settings.showOnDesktop;
}

function getInset(settings: ResolvedSettings): number {
  return isMobileViewport() ? settings.insetMobile : settings.insetDesktop;
}

function getSize(settings: ResolvedSettings, minimized: boolean): number {
  if (isMobileViewport()) {
    return minimized ? settings.mobileMinimizedSize : settings.mobileSize;
  }
  return minimized ? settings.desktopMinimizedSize : settings.desktopSize;
}

function getPageKey(): string {
  return window.location.pathname || '/';
}

function isHidden(pageKey: string): boolean {
  return dismissedPages.has(pageKey);
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

function withCacheBust(src: string): string {
  const separator = src.includes('?') ? '&' : '?';
  return `${src}${separator}hsrnd=${Math.floor(Math.random() * 1000) + 1}`;
}

function parseYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  return match?.[1] ?? null;
}

function getYouTubeEmbedUrl(videoId: string, options?: { muted?: boolean; controls?: boolean }): string {
  const params = new URLSearchParams({
    autoplay: '1',
    mute: options?.muted ? '1' : '0',
    loop: '1',
    playlist: videoId,
    controls: options?.controls ? '1' : '0',
    modestbranding: '1',
    rel: '0',
    playsinline: '1',
  });
  return `https://www.youtube.com/embed/${videoId}?${params}`;
}

// --- Styles ---

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #${ROOT_ID}{
      position:fixed;
      z-index:998;
      width:var(--hs-pvp-size,180px);
      height:var(--hs-pvp-size,180px);
      border-radius:50%;
      overflow:hidden;
      border:2px solid var(--hs-pvp-border,#ff4c34);
      background:rgba(255,255,255,0.8);
      box-shadow:0 4px 8px rgba(0,0,0,0.2);
      cursor:pointer;
      opacity:1;
      transition:left 0.24s ease-out,top 0.24s ease-out,width 0.3s ease-out,height 0.3s ease-out,transform 0.2s ease-out,opacity 0.22s ease-out;
      user-select:none;
      -webkit-user-select:none;
      touch-action:none;
      -webkit-tap-highlight-color:transparent;
      aspect-ratio:1 / 1;
    }
    #${ROOT_ID}:hover{
      transform:scale(1.1);
    }
    #${ROOT_ID}.is-dragging,
    #${ROOT_ID}.is-dismissing{
      transition:opacity 0.22s ease-out,transform 0.18s ease-out;
      transform:none;
    }
    #${ROOT_ID} video{
      width:100%;
      height:100%;
      object-fit:cover;
      object-position:center;
      display:block;
      pointer-events:none;
      border-radius:inherit;
    }
    #${ROOT_ID} iframe{
      position:absolute;
      top:50%;
      left:50%;
      width:300%;
      height:300%;
      transform:translate(-50%,-50%);
      border:none;
      pointer-events:none;
    }
    #${TOOLTIP_ID}{
      position:fixed;
      z-index:997;
      padding:8px 12px;
      border-radius:6px;
      background:#fff;
      color:#333;
      font:500 14px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
      box-shadow:0 6px 20px rgba(0,0,0,0.14);
      opacity:0;
      visibility:hidden;
      transform:translateX(10px);
      transition:opacity 0.18s ease-out,transform 0.18s ease-out,visibility 0.18s ease-out;
      white-space:nowrap;
    }
    #${TOOLTIP_ID}.is-visible{
      opacity:1;
      visibility:visible;
      transform:translateX(0);
    }
    #${OVERLAY_ID}{
      position:fixed;
      inset:0;
      z-index:2147483646;
      background:rgba(0,0,0,0.85);
      display:flex;
      flex-direction:column;
      justify-content:center;
      align-items:center;
      padding:16px;
      opacity:0;
      transition:opacity 0.28s ease-out;
    }
    #${OVERLAY_ID}.is-visible{
      opacity:1;
    }
    #${OVERLAY_ID} .hs-pvp__video{
      width:auto;
      height:auto;
      max-width:min(90vw,480px);
      max-height:min(65vh,720px);
      border-radius:10px;
      overflow:hidden;
      background:#000;
    }
    #${OVERLAY_ID} .hs-pvp__video video{
      display:block;
      width:100%;
      height:100%;
      max-width:min(90vw,480px);
      max-height:min(65vh,720px);
      border-radius:10px;
    }
    #${OVERLAY_ID} .hs-pvp__video iframe{
      display:block;
      width:min(90vw,480px);
      aspect-ratio:16/9;
      border-radius:10px;
      border:none;
    }
    #${OVERLAY_ID} .hs-pvp__mods{
      display:flex;
      flex-wrap:wrap;
      justify-content:center;
      gap:8px;
      margin-top:14px;
      max-width:min(90vw,720px);
    }
    #${OVERLAY_ID} .hs-pvp__mod{
      padding:8px 12px;
      border-radius:12px;
      border:2px solid rgba(255,255,255,0.3);
      background:#fff;
      color:#2b2b2b;
      font:500 14px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
    }
    #${OVERLAY_ID} .hs-pvp__mod.is-stockout{
      opacity:0.55;
      text-decoration:line-through;
      cursor:not-allowed;
      background:#f3f3f3;
    }
    #${OVERLAY_ID} .hs-pvp__guide{
      display:flex;
      align-items:center;
      gap:8px;
      margin-top:12px;
      color:#fff;
      font:500 14px/1.35 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
    }
    #${OVERLAY_ID} .hs-pvp__guide-icon{
      display:inline-flex;
      align-items:center;
      justify-content:center;
      width:18px;
      height:18px;
      border-radius:999px;
      border:1.5px solid currentColor;
      font-size:12px;
      font-weight:700;
    }
    #${OVERLAY_ID} .hs-pvp__action{
      margin-top:16px;
      border:none;
      border-radius:12px;
      background:#ff4c34;
      color:#fff;
      padding:12px 24px;
      font:700 18px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
      cursor:pointer;
      min-height:48px;
    }
    #${OVERLAY_ID} .hs-pvp__close{
      position:fixed;
      top:max(12px,env(safe-area-inset-top,12px));
      right:max(12px,env(safe-area-inset-right,12px));
      width:42px;
      height:42px;
      border-radius:999px;
      border:2px solid #ff4c34;
      background:rgba(255,76,52,0.88);
      color:#fff;
      font-size:22px;
      font-weight:700;
      cursor:pointer;
      z-index:2147483647;
    }
    @media (max-width:767px){
      #${ROOT_ID}:hover{
        transform:none;
      }
      #${OVERLAY_ID}{
        padding:12px;
      }
      #${OVERLAY_ID} .hs-pvp__video video{
        max-width:90vw;
        max-height:60vh;
      }
      #${OVERLAY_ID} .hs-pvp__video iframe{
        width:90vw;
      }
      #${OVERLAY_ID} .hs-pvp__mod{
        padding:6px 10px;
        font-size:12px;
      }
      #${OVERLAY_ID} .hs-pvp__action{
        width:min(90vw,360px);
        font-size:16px;
      }
    }
    @media (prefers-reduced-motion:reduce){
      #${ROOT_ID},
      #${TOOLTIP_ID},
      #${OVERLAY_ID}{
        transition:none;
      }
    }
  `;
  document.head.appendChild(style);
}

// --- Video source ---

function getVideoSources(selector: string): string[] {
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>(selector));
  return links
    .map((link) => link.href || link.getAttribute('href') || '')
    .filter((href) => href.toLowerCase().includes('.mp4'));
}

function findYouTubeOnPage(): string | null {
  // 1. YouTube iframes (embeds) — check both src and data-src (lazy-loaded)
  const iframes = Array.from(document.querySelectorAll<HTMLIFrameElement>(
    'iframe[src*="youtube.com/embed/"], iframe[src*="youtube-nocookie.com/embed/"], iframe[data-src*="youtube.com/embed/"], iframe[data-src*="youtube-nocookie.com/embed/"]',
  ));
  for (const iframe of iframes) {
    const src = iframe.src || iframe.getAttribute('data-src') || iframe.getAttribute('src') || '';
    const id = parseYouTubeId(src);
    if (id) return `https://www.youtube.com/watch?v=${id}`;
  }

  // 2. Links to YouTube
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href*="youtube.com/watch"], a[href*="youtu.be/"], a[href*="youtube.com/shorts/"]'));
  for (const link of links) {
    const href = link.href || link.getAttribute('href') || '';
    const id = parseYouTubeId(href);
    if (id) return `https://www.youtube.com/watch?v=${id}`;
  }

  return null;
}

function chooseVideoSrc(selector: string): { src: string; source: 'mp4' | 'youtube-page' } | null {
  // MP4 links on the page
  const mp4Sources = getVideoSources(selector);
  if (mp4Sources.length > 0) {
    const index = Math.floor(Math.random() * mp4Sources.length);
    const src = mp4Sources[index];
    return src ? { src, source: 'mp4' } : null;
  }

  // YouTube on the page
  const yt = findYouTubeOnPage();
  return yt ? { src: yt, source: 'youtube-page' } : null;
}

function showToast(message: string): void {
  const toast = document.createElement('div');
  toast.textContent = message;
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: '2147483647',
    padding: '12px 20px',
    borderRadius: '10px',
    background: '#7c3aed',
    color: '#fff',
    font: '500 14px/1.3 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    opacity: '0',
    transition: 'opacity 0.3s ease-out',
  });
  document.body.appendChild(toast);
  requestAnimationFrame(() => { toast.style.opacity = '1'; });
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// --- Tooltip ---

function hideTooltip(state: WidgetState): void {
  state.tooltip?.classList.remove('is-visible');
}

function updateTooltipPosition(state: WidgetState): void {
  if (!state.tooltip) return;
  const rect = state.root.getBoundingClientRect();
  state.tooltip.style.top = `${rect.top + rect.height / 2 - state.tooltip.offsetHeight / 2}px`;

  if (state.edge === 'right') {
    state.tooltip.style.left = `${rect.left - state.tooltip.offsetWidth - 10}px`;
  } else {
    state.tooltip.style.left = `${rect.right + 10}px`;
  }
}

function createTooltip(settings: ResolvedSettings): HTMLDivElement | null {
  if (isMobileViewport()) return null;

  const tooltip = document.createElement('div');
  tooltip.id = TOOLTIP_ID;
  tooltip.textContent = settings.tooltipText;
  document.body.appendChild(tooltip);
  return tooltip;
}

// --- Position ---

function applyPosition(state: WidgetState, top: number, edge: Edge = state.edge): void {
  const inset = getInset(state.settings);
  const size = getSize(state.settings, state.isMinimized);
  const maxTop = window.innerHeight - size - inset;
  const safeTop = clamp(top, inset, maxTop);
  const left = edge === 'left' ? inset : Math.max(inset, window.innerWidth - size - inset);

  state.edge = edge;
  state.top = safeTop;
  state.root.style.left = `${left}px`;
  state.root.style.top = `${safeTop}px`;
  updateTooltipPosition(state);
}

function applySize(state: WidgetState): void {
  const size = getSize(state.settings, state.isMinimized);
  state.root.style.setProperty('--hs-pvp-size', `${size}px`);
  state.root.style.setProperty('--hs-pvp-border', state.settings.borderColor);
  applyPosition(state, state.top, state.edge);
}

// --- Overlay ---

function renderModificationPreview(settings: ResolvedSettings): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const buttons = Array.from(
    document.querySelectorAll<HTMLElement>('.modification__list .modification__button'),
  );

  if (buttons.length > 0) {
    const mods = document.createElement('div');
    mods.className = 'hs-pvp__mods';

    buttons.forEach((button) => {
      const chip = document.createElement('div');
      chip.className = 'hs-pvp__mod';
      chip.textContent = button.textContent?.trim().split('\n')[0]?.trim() ?? '';
      if (button.classList.contains('modification__button--stockout')) {
        chip.classList.add('is-stockout');
      }
      mods.appendChild(chip);
    });

    fragment.appendChild(mods);
  }

  if (settings.sizeGuideText) {
    const guide = document.createElement('div');
    guide.className = 'hs-pvp__guide';
    guide.innerHTML = `<span class="hs-pvp__guide-icon">i</span><span>${settings.sizeGuideText}</span>`;
    fragment.appendChild(guide);
  }

  return fragment;
}

function highlightModificationsBlock(): void {
  const target = document.querySelector<HTMLElement>(
    isMobileViewport()
      ? 'div[data-view-block="modifications"]'
      : '.product__modifications',
  );
  if (!target) return;

  if (isMobileViewport()) {
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
  window.setTimeout(() => {
    target.style.transition = 'outline-color 0.25s ease-out, outline-offset 0.25s ease-out';
    target.style.outline = '3px solid transparent';
    target.style.outlineOffset = '5px';
    target.style.borderRadius = '10px';
    target.style.outlineColor = '#ff4c34';

    window.setTimeout(() => {
      target.style.outlineColor = 'transparent';
      window.setTimeout(() => {
        target.style.outline = '';
        target.style.outlineOffset = '';
        target.style.borderRadius = '';
        target.style.transition = '';
      }, 260);
    }, 1400);
  }, 60);
}

function closeOverlay(state: WidgetState): void {
  if (!state.overlay) return;

  state.overlay.backdrop.classList.remove('is-visible');
  document.removeEventListener('keydown', state.overlay.onEscape);

  const overlay = state.overlay;
  state.overlay = null;

  window.setTimeout(() => {
    overlay.backdrop.remove();
    overlay.closeButton.remove();
  }, 280);
}

function openOverlay(state: WidgetState): void {
  if (state.overlay) return;
  hideTooltip(state);

  const backdrop = document.createElement('div');
  backdrop.id = OVERLAY_ID;

  const videoWrap = document.createElement('div');
  videoWrap.className = 'hs-pvp__video';

  const youtubeId = parseYouTubeId(state.videoSrc);
  let overlayVideo: HTMLVideoElement | null = null;

  if (youtubeId) {
    const iframe = document.createElement('iframe');
    iframe.src = getYouTubeEmbedUrl(youtubeId, { muted: false, controls: true });
    iframe.allow = 'autoplay; encrypted-media; fullscreen';
    iframe.allowFullscreen = true;
    videoWrap.appendChild(iframe);
  } else {
    const video = document.createElement('video');
    video.src = state.videoSrc;
    video.loop = true;
    video.autoplay = true;
    video.muted = true;
    video.controls = false;
    video.preload = 'metadata';
    video.setAttribute('playsinline', 'playsinline');
    video.setAttribute('webkit-playsinline', '');
    overlayVideo = video;
    videoWrap.appendChild(video);
  }

  backdrop.appendChild(videoWrap);
  backdrop.appendChild(renderModificationPreview(state.settings));

  const actionButton = document.createElement('button');
  actionButton.className = 'hs-pvp__action';
  actionButton.type = 'button';
  actionButton.textContent = state.settings.actionButtonText;
  backdrop.appendChild(actionButton);

  const closeButton = document.createElement('button');
  closeButton.className = 'hs-pvp__close';
  closeButton.type = 'button';
  closeButton.setAttribute('aria-label', state.settings.closeLabel);
  closeButton.textContent = '\u2715';

  const onEscape = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      closeOverlay(state);
    }
  };

  actionButton.addEventListener('click', (event) => {
    event.stopPropagation();
    closeOverlay(state);
    window.setTimeout(highlightModificationsBlock, 320);
  });

  closeButton.addEventListener('click', () => closeOverlay(state));
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) {
      closeOverlay(state);
    }
  });

  document.addEventListener('keydown', onEscape);
  document.body.appendChild(backdrop);
  document.body.appendChild(closeButton);
  state.overlay = { backdrop, closeButton, actionButton, onEscape };

  window.setTimeout(() => {
    backdrop.classList.add('is-visible');
    if (overlayVideo) {
      void overlayVideo.play().catch(() => undefined);
    }
  }, 10);
}

// --- Dismiss ---

function dismissWidget(state: WidgetState, direction: Edge): void {
  if (state.isDestroyed) return;
  dismissedPages.add(state.pageKey);
  closeOverlay(state);
  hideTooltip(state);

  const size = getSize(state.settings, state.isMinimized);
  state.root.classList.add('is-dismissing');
  state.root.style.opacity = '0';
  state.root.style.left = direction === 'left' ? `${-size}px` : `${window.innerWidth}px`;

  window.setTimeout(() => {
    if (widget === state) {
      destroyWidget();
    }
  }, DISMISS_ANIMATION_MS);
}

function shouldDismissAfterDrag(currentLeft: number, size: number): Edge | null {
  const hiddenOnLeft = Math.max(0, -currentLeft);
  if (hiddenOnLeft > size / 2) return 'left';

  const hiddenOnRight = Math.max(0, currentLeft + size - window.innerWidth);
  if (hiddenOnRight > size / 2) return 'right';

  return null;
}

// --- Scroll ---

function handleScroll(state: WidgetState): void {
  if (state.overlay) return;
  const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
  state.scrollDistance += Math.abs(currentScrollTop - state.lastScrollTop);
  state.lastScrollTop = currentScrollTop;

  if (state.scrollDistance > SCROLL_MINIMIZE_DISTANCE && !state.isMinimized) {
    state.isMinimized = true;
    hideTooltip(state);
    applySize(state);
  }
}

// --- Drag ---

function attachMobileDrag(state: WidgetState): void {
  const finishDrag = (): void => {
    if (!state.drag.active) return;
    state.drag.active = false;
    state.root.classList.remove('is-dragging');

    if (!state.drag.moved) return;

    const size = getSize(state.settings, state.isMinimized);
    const currentLeft = Number.parseFloat(state.root.style.left) || 0;
    const currentTop = Number.parseFloat(state.root.style.top) || state.top;
    const dismissDirection = shouldDismissAfterDrag(currentLeft, size);

    if (dismissDirection) {
      dismissWidget(state, dismissDirection);
    } else {
      const nextEdge: Edge = currentLeft + size / 2 < window.innerWidth / 2 ? 'left' : 'right';
      applyPosition(state, currentTop, nextEdge);
    }

    state.drag.pointerId = null;
    state.drag.moved = false;
    state.drag.dx = 0;
    state.drag.dy = 0;

    window.setTimeout(() => {
      state.suppressClick = false;
    }, 0);
  };

  const interactable = interact(state.root).draggable({
    listeners: {
      start(event) {
        if (!isMobileViewport() || state.overlay) {
          state.drag.active = false;
          return;
        }

        state.drag.active = true;
        state.drag.pointerId = event.pointerId ?? null;
        state.drag.startX = event.clientX ?? 0;
        state.drag.startY = event.clientY ?? 0;
        state.drag.startLeft = Number.parseFloat(state.root.style.left) || 0;
        state.drag.startTop = Number.parseFloat(state.root.style.top) || state.top;
        state.drag.dx = 0;
        state.drag.dy = 0;
        state.drag.moved = false;
      },
      move(event) {
        if (!state.drag.active || !isMobileViewport()) return;

        state.drag.dx += event.dx ?? 0;
        state.drag.dy += event.dy ?? 0;

        if (!state.drag.moved && Math.abs(state.drag.dx) + Math.abs(state.drag.dy) < MIN_DRAG_DISTANCE) {
          return;
        }

        state.drag.moved = true;
        state.suppressClick = true;
        hideTooltip(state);
        state.root.classList.add('is-dragging');

        const inset = getInset(state.settings);
        const size = getSize(state.settings, state.isMinimized);
        const left = clamp(state.drag.startLeft + state.drag.dx, -size, window.innerWidth);
        const top = clamp(state.drag.startTop + state.drag.dy, inset, window.innerHeight - size - inset);

        state.root.style.left = `${left}px`;
        state.root.style.top = `${top}px`;
      },
      end() {
        finishDrag();
      },
    },
  });
  state.destroyDrag = () => {
    interactable.unset();
  };
}

// --- Widget lifecycle ---

function destroyWidget(): void {
  if (!widget) return;

  widget.isDestroyed = true;
  widget.removeScrollListener();
  widget.destroyDrag();
  closeOverlay(widget);
  hideTooltip(widget);
  widget.tooltip?.remove();
  widget.root.remove();
  widget = null;
}

function createWidget(videoSrc: string, settings: ResolvedSettings, pageKey: string): WidgetState {
  const root = document.createElement('div');
  root.id = ROOT_ID;

  const youtubeId = parseYouTubeId(videoSrc);
  let mediaElement: HTMLVideoElement | HTMLIFrameElement;

  if (youtubeId) {
    const iframe = document.createElement('iframe');
    iframe.src = getYouTubeEmbedUrl(youtubeId, { muted: true, controls: false });
    iframe.allow = 'autoplay; encrypted-media';
    iframe.tabIndex = -1;
    mediaElement = iframe;
  } else {
    const video = document.createElement('video');
    video.src = withCacheBust(videoSrc);
    video.loop = true;
    video.autoplay = true;
    video.muted = true;
    video.controls = false;
    video.preload = 'none';
    video.setAttribute('playsinline', 'playsinline');
    video.setAttribute('webkit-playsinline', '');
    video.ondragstart = () => false;
    mediaElement = video;
  }

  root.appendChild(mediaElement);
  document.body.appendChild(root);

  const tooltip = createTooltip(settings);
  const onScroll = (): void => {
    if (widget) handleScroll(widget);
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  const state: WidgetState = {
    root,
    video: mediaElement,
    tooltip,
    overlay: null,
    pageKey,
    videoSrc,
    settings,
    edge: 'right',
    top: 0,
    isMinimized: false,
    lastScrollTop: window.pageYOffset || document.documentElement.scrollTop || 0,
    scrollDistance: 0,
    suppressClick: false,
    isDestroyed: false,
    removeScrollListener: () => window.removeEventListener('scroll', onScroll),
    destroyDrag: () => undefined,
    drag: {
      active: false,
      pointerId: null,
      startX: 0,
      startY: 0,
      startLeft: 0,
      startTop: 0,
      dx: 0,
      dy: 0,
      moved: false,
    },
  };

  const initialInset = getInset(settings);
  const initialSize = getSize(settings, false);
  state.top = Math.max(initialInset, window.innerHeight - initialSize - initialInset);
  applySize(state);

  root.addEventListener('click', (event) => {
    if (state.suppressClick) {
      event.preventDefault();
      event.stopPropagation();
      state.suppressClick = false;
      return;
    }

    if (state.overlay) return;
    state.isMinimized = false;
    state.scrollDistance = 0;
    applySize(state);
    openOverlay(state);
  });

  if (tooltip) {
    root.addEventListener('mouseenter', () => {
      if (isMobileViewport()) return;
      updateTooltipPosition(state);
      tooltip.classList.add('is-visible');
    });
    root.addEventListener('mouseleave', () => {
      hideTooltip(state);
    });
  }

  attachMobileDrag(state);
  return state;
}

// --- Sync ---

let savedConfig: ProductVideoPreviewConfig | null = null;
let savedI18n: { tooltipText: string; actionButtonText: string; sizeGuideText: string; closeLabel: string } | null = null;

function getResolvedSettings(): ResolvedSettings | null {
  if (!savedConfig || !savedI18n) return null;
  return { ...savedConfig, ...savedI18n };
}

function syncWidget(): void {
  if (typeof document === 'undefined') return;

  const settings = getResolvedSettings();
  if (!settings || !settings.enabled || !shouldShowForViewport(settings)) {
    destroyWidget();
    return;
  }

  const pageKey = getPageKey();
  if (isHidden(pageKey)) {
    destroyWidget();
    return;
  }

  const pageResult = chooseVideoSrc(settings.mp4Selector);
  const resolvedVideoSrc = pageResult?.src || settings.testVideoUrl?.trim();
  const videoSrc =
    widget && widget.pageKey === pageKey ? resolvedVideoSrc || widget.videoSrc : resolvedVideoSrc;
  if (!videoSrc) {
    destroyWidget();
    console.warn('[widgetality] product-video-preview: ⚠️ no video found on this page (selector:', settings.mp4Selector, ')');
    return;
  }

  if (pageResult?.source === 'youtube-page' && (!widget || widget.pageKey !== pageKey)) {
    // toast removed — no need to notify about YouTube detection
  }

  if (widget && widget.pageKey === pageKey) {
    if (widget.videoSrc !== videoSrc) {
      destroyWidget();
      widget = createWidget(videoSrc, settings, pageKey);
      return;
    }
    widget.settings = settings;
    applySize(widget);
    return;
  }

  destroyWidget();
  widget = createWidget(videoSrc, settings, pageKey);
}

function scheduleSync(): void {
  if (syncTimer !== null) window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(() => {
    syncTimer = null;
    syncWidget();
  }, OBSERVER_DEBOUNCE_MS);
}

function patchHistory(): void {
  if (historyPatched || typeof window === 'undefined') return;
  historyPatched = true;
  (window as any).__hsPvpHistoryPatched = true;

  (['pushState', 'replaceState'] as const).forEach((methodName) => {
    const original = history[methodName];
    history[methodName] = function patchedHistory(
      this: History,
      ...args: Parameters<History['pushState']>
    ) {
      const result = original.apply(this, args);
      window.dispatchEvent(new Event('hs-product-video-preview:navigate'));
      return result;
    };
  });
}

function ensureObservers(settings: ResolvedSettings): void {
  if (!settings.observeSpa) return;

  patchHistory();

  if (!historyListenersAttached) {
    historyListenersAttached = true;
    window.addEventListener('popstate', scheduleSync);
    window.addEventListener('hashchange', scheduleSync);
    window.addEventListener('resize', scheduleSync);
    window.addEventListener('hs-product-video-preview:navigate', scheduleSync);
  }

  if (!observer) {
    observer = new MutationObserver(() => scheduleSync());
    observer.observe(document.body, { childList: true, subtree: true });
  }
}

// --- Entry point ---

export default function productVideoPreview(
  rawConfig: ProductVideoPreviewInput,
  rawI18n: Record<string, { tooltipText: string; actionButtonText: string; sizeGuideText: string; closeLabel: string }>,
): (() => void) | void {
  if (typeof document === 'undefined') return;

  const config = productVideoPreviewSchema.parse(rawConfig);
  const i18nMap = productVideoPreviewI18nSchema.parse(rawI18n);
  if (!config.enabled) { console.warn('[widgetality] product-video-preview: ⚠️ disabled'); return; }
  console.log('[widgetality] product-video-preview: ✅ activated');

  const lang = getLanguage();
  const i18n = i18nMap[lang] ?? i18nMap.ua ?? i18nMap.ru ?? Object.values(i18nMap)[0]!;

  savedConfig = config;
  savedI18n = i18n;

  ensureStyles();
  const settings = getResolvedSettings()!;
  ensureObservers(settings);
  syncWidget();

  return () => {
    destroyWidget();
    if (observer) { observer.disconnect(); observer = null; }
    if (syncTimer !== null) { window.clearTimeout(syncTimer); syncTimer = null; }
    if (historyListenersAttached) {
      window.removeEventListener('popstate', scheduleSync);
      window.removeEventListener('hashchange', scheduleSync);
      window.removeEventListener('resize', scheduleSync);
      window.removeEventListener('hs-product-video-preview:navigate', scheduleSync);
      historyListenersAttached = false;
    }
    savedConfig = null;
    savedI18n = null;
    dismissedPages.clear();
    document.getElementById(STYLE_ID)?.remove();
  };
}

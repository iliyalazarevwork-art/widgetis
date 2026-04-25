import type { PhotoReviewsConfig, PhotoReviewsI18n } from './schema';

// ── Constants ──────────────────────────────────────────────────────────────────

const STYLE_ID = 'hs-photo-reviews-upload-styles';
const INJECTED_FLAG = 'data-hs-photo-reviews-upload-injected';

const PHOTO_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;
const VIDEO_MIME = ['video/mp4', 'video/webm', 'video/quicktime'] as const;

const CSS = `
  .wty-pr-wrap{margin:12px 0;font:inherit;color:inherit}
  .wty-pr-btn{display:inline-flex;align-items:center;gap:6px;padding:10px 16px;border:1px solid #cfd4dc;border-radius:8px;background:#fff;cursor:pointer;font:inherit;color:inherit;line-height:1}
  .wty-pr-btn:hover{background:#f5f7fa}
  .wty-pr-btn svg{width:16px;height:16px;flex:0 0 auto}
  .wty-pr-hint{margin-top:6px;font-size:12px;color:#7b8590}
  .wty-pr-err{margin-top:6px;font-size:12px;color:#c0392b}
  .wty-pr-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px;margin-top:10px}
  .wty-pr-item{position:relative;aspect-ratio:1;border-radius:8px;overflow:hidden;background:#000}
  .wty-pr-item img,.wty-pr-item video{width:100%;height:100%;object-fit:cover;display:block}
  .wty-pr-item .wty-pr-rm{position:absolute;top:4px;right:4px;width:22px;height:22px;border:0;border-radius:50%;background:rgba(0,0,0,.65);color:#fff;cursor:pointer;font-size:14px;line-height:22px;padding:0;text-align:center}
  .wty-pr-item .wty-pr-rm:hover{background:rgba(0,0,0,.85)}
  .wty-pr-vbadge{position:absolute;left:4px;bottom:4px;background:rgba(0,0,0,.65);color:#fff;font-size:10px;padding:2px 6px;border-radius:4px;letter-spacing:.5px}
`;

// ── Types ──────────────────────────────────────────────────────────────────────

type I18nKeys = {
  viewPhotoLabel: string;
  closeLabel: string;
  prevLabel: string;
  nextLabel: string;
  addMediaLabel: string;
  mediaHint: string;
  errPhotoMime: string;
  errPhotoSize: string;
  errPhotoCount: string;
  errVideoMime: string;
  errVideoSize: string;
  errMixed: string;
  removeLabel: string;
};

export type UploadSettings = PhotoReviewsConfig & I18nKeys;

type MediaState = {
  photos: File[];
  video: File | null;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

function removeStyles(): void {
  document.getElementById(STYLE_ID)?.remove();
}

function fmtMb(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1) + ' МБ';
}

function resolveExternalProductId(): string | null {
  const page = document.querySelector<HTMLElement>(
    '[class*="j-product-page"][data-id], .j-product-container[data-id], [data-product-id]',
  );
  if (page) {
    const id = page.getAttribute('data-id') ?? page.getAttribute('data-product-id');
    if (id && /^\d+$/.test(id)) return id;
  }

  const modForm = document.querySelector<HTMLElement>(
    'form[data-action*="/catalog/load-modification/"]',
  );
  if (modForm) {
    const action = modForm.getAttribute('data-action') ?? '';
    const match = action.match(/\/load-modification\/(\d+)\//);
    if (match) return match[1]!;
  }

  const path = (location.pathname ?? '').replace(/\/$/, '');
  const tail = path.split('/').pop() ?? '';
  if (/^\d+$/.test(tail)) return tail;
  return path.split('/').filter(Boolean).pop() ?? null;
}

function buildAddButton(label: string): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'wty-pr-btn';
  btn.dataset['role'] = 'add';
  btn.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="m21 17-5-5L7 19"/>' +
    '</svg>' +
    `<span>${label}</span>`;
  return btn;
}

function buildFileInput(): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;
  input.accept = 'image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime';
  input.hidden = true;
  return input;
}

function buildUI(s: UploadSettings): {
  wrap: HTMLDivElement;
  btn: HTMLButtonElement;
  fileInput: HTMLInputElement;
  grid: HTMLDivElement;
  errBox: HTMLDivElement;
} {
  const wrap = document.createElement('div');
  wrap.className = 'wty-pr-wrap';

  const btn = buildAddButton(s.addMediaLabel);
  const hint = document.createElement('div');
  hint.className = 'wty-pr-hint';
  hint.textContent = s.mediaHint;

  const errBox = document.createElement('div');
  errBox.className = 'wty-pr-err';
  errBox.hidden = true;

  const fileInput = buildFileInput();
  const grid = document.createElement('div');
  grid.className = 'wty-pr-grid';

  wrap.appendChild(btn);
  wrap.appendChild(hint);
  wrap.appendChild(errBox);
  wrap.appendChild(fileInput);
  wrap.appendChild(grid);

  return { wrap, btn, fileInput, grid, errBox };
}

function showError(errBox: HTMLDivElement, msg: string): void {
  if (!msg) {
    errBox.hidden = true;
    errBox.textContent = '';
    return;
  }
  errBox.hidden = false;
  errBox.textContent = msg;
}

function renderPhotoTile(
  file: File,
  removeLabel: string,
  onRemove: () => void,
): HTMLDivElement {
  const tile = document.createElement('div');
  tile.className = 'wty-pr-item';
  const url = URL.createObjectURL(file);
  const rm = document.createElement('button');
  rm.type = 'button';
  rm.className = 'wty-pr-rm';
  rm.setAttribute('aria-label', removeLabel);
  rm.textContent = '×';
  rm.addEventListener('click', () => {
    URL.revokeObjectURL(url);
    onRemove();
  });
  const img = document.createElement('img');
  img.src = url;
  img.alt = '';
  tile.appendChild(img);
  tile.appendChild(rm);
  return tile;
}

function renderVideoTile(
  file: File,
  removeLabel: string,
  onRemove: () => void,
): HTMLDivElement {
  const tile = document.createElement('div');
  tile.className = 'wty-pr-item';
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.src = url;
  video.muted = true;
  video.playsInline = true;
  const badge = document.createElement('span');
  badge.className = 'wty-pr-vbadge';
  badge.textContent = 'VIDEO';
  const rm = document.createElement('button');
  rm.type = 'button';
  rm.className = 'wty-pr-rm';
  rm.setAttribute('aria-label', removeLabel);
  rm.textContent = '×';
  rm.addEventListener('click', () => {
    URL.revokeObjectURL(url);
    onRemove();
  });
  tile.appendChild(video);
  tile.appendChild(badge);
  tile.appendChild(rm);
  return tile;
}

function renderPreviews(
  grid: HTMLDivElement,
  state: MediaState,
  removeLabel: string,
  onRerender: () => void,
): void {
  grid.innerHTML = '';

  state.photos.forEach((file, idx) => {
    const tile = renderPhotoTile(file, removeLabel, () => {
      state.photos.splice(idx, 1);
      onRerender();
    });
    grid.appendChild(tile);
  });

  if (state.video) {
    const captured = state.video;
    const tile = renderVideoTile(captured, removeLabel, () => {
      state.video = null;
      onRerender();
    });
    grid.appendChild(tile);
  }
}

// ── Validation ─────────────────────────────────────────────────────────────────

function validatePhotos(
  incoming: File[],
  state: MediaState,
  s: UploadSettings,
): string | null {
  const maxPhotoBytes = s.maxPhotoSizeMb * 1024 * 1024;

  for (const file of incoming) {
    if (!(PHOTO_MIME as readonly string[]).includes(file.type)) return s.errPhotoMime;
    if (file.size > maxPhotoBytes) return `${s.errPhotoSize}: ${file.name} (${fmtMb(file.size)})`;
  }

  if (state.photos.concat(incoming).length > s.maxPhotos) return s.errPhotoCount;
  return null;
}

function validateVideo(file: File, s: UploadSettings): string | null {
  const maxVideoBytes = s.maxVideoSizeMb * 1024 * 1024;
  if (!(VIDEO_MIME as readonly string[]).includes(file.type)) return s.errVideoMime;
  if (file.size > maxVideoBytes) return `${s.errVideoSize} (${fmtMb(file.size)})`;
  return null;
}

function validateMixedSelection(
  incoming: File[],
  state: MediaState,
  s: UploadSettings,
): string | null {
  const hasVideo = incoming.some((f) => f.type.startsWith('video/'));
  const hasPhoto = incoming.some((f) => f.type.startsWith('image/'));

  if (hasVideo && hasPhoto) return s.errMixed;
  if (hasVideo && (state.photos.length > 0 || incoming.filter((f) => f.type.startsWith('video/')).length > 1)) {
    return s.errMixed;
  }
  if (hasPhoto && state.video !== null) return s.errMixed;
  return null;
}

// ── Network ────────────────────────────────────────────────────────────────────

function submitToBackend(form: HTMLFormElement, state: MediaState, s: UploadSettings): void {
  if (state.photos.length === 0 && state.video === null) return;

  const fd = new FormData();
  const nameInput = form.querySelector<HTMLInputElement>('[name="form[title]"]');
  const emailInput = form.querySelector<HTMLInputElement>('[name="form[email]"]');
  const textInput = form.querySelector<HTMLTextAreaElement>('[name="form[text]"]');
  const rateInput = form.querySelector<HTMLInputElement>('[name="form[rate]"]');
  const productId = resolveExternalProductId();

  fd.append('visitor_name', nameInput?.value ?? '');
  fd.append('visitor_email', emailInput?.value ?? '');
  fd.append('text', textInput?.value ?? '');
  fd.append('rating', rateInput?.value ?? '');
  if (productId) fd.append('external_product_id', productId);

  if (state.video) {
    fd.append('video', state.video, state.video.name);
  } else {
    for (const photo of state.photos) {
      fd.append('photos[]', photo, photo.name);
    }
  }

  try {
    fetch(s.uploadApiUrl, {
      method: 'POST',
      body: fd,
      credentials: 'omit',
      mode: 'cors',
      keepalive: true,
    }).catch(() => {});
  } catch {
    // swallow — must never break native submit
  }
}

// ── Form injection ─────────────────────────────────────────────────────────────

function attachFileInput(
  fileInput: HTMLInputElement,
  btn: HTMLButtonElement,
  grid: HTMLDivElement,
  errBox: HTMLDivElement,
  state: MediaState,
  s: UploadSettings,
): void {
  btn.addEventListener('click', () => {
    showError(errBox, '');
    fileInput.click();
  });

  fileInput.addEventListener('change', () => {
    const files = Array.from(fileInput.files ?? []);
    fileInput.value = '';
    if (files.length === 0) return;

    const mixedErr = validateMixedSelection(files, state, s);
    if (mixedErr) {
      showError(errBox, mixedErr);
      return;
    }

    const hasVideo = files.some((f) => f.type.startsWith('video/'));

    if (hasVideo) {
      const videoErr = validateVideo(files[0]!, s);
      if (videoErr) {
        showError(errBox, videoErr);
        return;
      }
      state.video = files[0]!;
    } else {
      const photoErr = validatePhotos(files, state, s);
      if (photoErr) {
        showError(errBox, photoErr);
        return;
      }
      state.photos = state.photos.concat(files);
    }

    showError(errBox, '');
    renderPreviews(grid, state, s.removeLabel, () =>
      renderPreviews(grid, state, s.removeLabel, () => {}),
    );
  });
}

function injectForm(form: HTMLFormElement, s: UploadSettings): void {
  if (form.getAttribute(INJECTED_FLAG) === '1') return;

  const textarea = form.querySelector<HTMLElement>(s.uploadTextareaSelector);
  if (!textarea) return;

  form.setAttribute(INJECTED_FLAG, '1');

  const { wrap, btn, fileInput, grid, errBox } = buildUI(s);
  textarea.parentNode!.insertBefore(wrap, textarea.nextSibling);

  const state: MediaState = { photos: [], video: null };

  attachFileInput(fileInput, btn, grid, errBox, state, s);

  const submitHandler = (): void => submitToBackend(form, state, s);
  form.addEventListener('submit', submitHandler, true);

  // store cleanup on the element for later removal
  (form as HTMLFormElement & { _wtyCleanup?: () => void })._wtyCleanup = () => {
    form.removeEventListener('submit', submitHandler, true);
    wrap.remove();
    form.removeAttribute(INJECTED_FLAG);
  };
}

function scanForms(root: ParentNode, s: UploadSettings): void {
  const forms = root.querySelectorAll<HTMLFormElement>(s.uploadFormSelector);
  forms.forEach((form) => injectForm(form, s));
}

// ── Public API ─────────────────────────────────────────────────────────────────

export function startUpload(s: UploadSettings): () => void {
  if (!s.uploadApiUrl) {
    console.warn('[widgetality] photo-reviews upload: uploadApiUrl is empty — upload disabled');
    return () => { /* no-op */ };
  }
  injectStyles();
  scanForms(document, s);

  const mo = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node.matches(s.uploadFormSelector)) injectForm(node as HTMLFormElement, s);
        scanForms(node, s);
      }
    }
  });

  mo.observe(document.body, { childList: true, subtree: true });

  return () => {
    mo.disconnect();

    document.querySelectorAll<HTMLFormElement & { _wtyCleanup?: () => void }>(
      `[${INJECTED_FLAG}]`,
    ).forEach((form) => {
      form._wtyCleanup?.();
    });

    removeStyles();
  };
}

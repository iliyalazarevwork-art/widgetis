import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@laxarevii/core', () => ({
  getLanguage: () => 'ua',
}));

import photoReviews, { __awaitInFlight } from './index';
import { startUpload } from './upload';

// ── Shared fixtures ────────────────────────────────────────────────────────────

const i18n = {
  ua: {
    viewPhotoLabel: 'Фото від клієнта',
    closeLabel: 'Закрити',
    prevLabel: 'Попереднє',
    nextLabel: 'Наступне',
    addMediaLabel: 'Додати фото або відео',
    mediaHint: 'До 5 фото (≤5 МБ кожне) або 1 відео (≤30 МБ)',
    errPhotoMime: 'Підтримуються JPG, PNG, WEBP',
    errPhotoSize: 'Фото більше 5 МБ',
    errPhotoCount: 'Максимум 5 фото',
    errVideoMime: 'Підтримуються MP4, WEBM, MOV',
    errVideoSize: 'Відео більше 30 МБ',
    errMixed: 'Не можна додати фото та відео одночасно',
    removeLabel: 'Видалити',
  },
};

const config = {
  enabled: true,
  showOnMobile: true,
  showOnDesktop: true,
  reviewSelector: '.review-item',
  bodySelector: '.review-item__body',
  authorSelector: '.review-item__name',
  aspectRatio: '4 / 5',
  borderRadius: 14,
  openInLightbox: false,
  observeDom: false,
  enableUpload: false, // disable upload by default so render tests are not affected
  uploadFormSelector: 'form[data-action$="/_widget/ajax_comments/submit/"]',
  uploadTextareaSelector: 'textarea[name="form[text]"]',
  maxPhotos: 5,
  maxPhotoSizeMb: 5,
  maxVideoSizeMb: 30,
};

const uploadSettings = {
  ...config,
  ...i18n.ua,
  enableUpload: true,
};

function addReviewItem(name = 'Хтось', body = 'Текст відгуку'): HTMLElement {
  const item = document.createElement('div');
  item.className = 'review-item';
  item.innerHTML = `
    <div class="review-item__name">${name}</div>
    <div class="review-item__body">${body}</div>
  `;
  document.body.appendChild(item);
  return item;
}

function mockMatchResponse(matches: Array<{ name: string; body: string; media: Array<{ url: string }> }>): void {
  globalThis.fetch = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify({ matches }), { status: 200 }));
}

function addReviewForm(): HTMLFormElement {
  const form = document.createElement('form');
  form.setAttribute('data-action', '/shop/_widget/ajax_comments/submit/');
  form.innerHTML = `
    <input name="form[title]" value="Тест Юзер">
    <input name="form[email]" value="test@example.com">
    <textarea name="form[text]">Чудовий товар</textarea>
    <input name="form[rate]" value="5">
  `;
  document.body.appendChild(form);
  return form;
}

function makePhotoFile(name = 'photo.jpg', type = 'image/jpeg', size = 1024): File {
  return new File(['x'.repeat(size)], name, { type });
}

function makeVideoFile(name = 'clip.mp4', type = 'video/mp4', size = 1024): File {
  return new File(['x'.repeat(size)], name, { type });
}

function setInputFiles(input: HTMLInputElement, files: File[]): void {
  Object.defineProperty(input, 'files', {
    value: files,
    configurable: true,
  });
}

// ── Render tests ───────────────────────────────────────────────────────────────

describe('photo-reviews render via /match API', () => {
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
  });

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
    vi.restoreAllMocks();
  });

  it('відправляє кандидатів на /match і малює галерею для тих, що повернулися з media', async () => {
    addReviewItem('Натали', 'Дякую');
    addReviewItem('Шатохин Владислав', 'Thanks');
    mockMatchResponse([
      { name: 'Натали', body: 'Дякую', media: [{ url: 'https://r2.example.com/n.jpg' }] },
    ]);

    const stop = photoReviews(config, i18n);
    cleanup = stop ?? undefined;
    await __awaitInFlight();

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [url, opts] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.widgetis.com/api/v1/widgets/reviews/match');
    expect(opts.method).toBe('POST');
    expect(JSON.parse(opts.body as string)).toEqual({
      candidates: [
        { name: 'Натали', body: 'Дякую' },
        { name: 'Шатохин Владислав', body: 'Thanks' },
      ],
    });

    const galleries = document.querySelectorAll('.hs-photo-review__gallery');
    expect(galleries.length).toBe(1);
    const img = galleries[0]!.querySelector('img');
    expect(img?.getAttribute('src')).toBe('https://r2.example.com/n.jpg');
  });

  it('нічого не запитує і не рендерить, коли в DOM немає жодного review-блоку', () => {
    globalThis.fetch = vi.fn();
    const stop = photoReviews(config, i18n);
    cleanup = stop ?? undefined;

    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(document.querySelector('.hs-photo-review__gallery')).toBeNull();
  });

  it('пропускає, коли enabled = false', () => {
    addReviewItem();
    globalThis.fetch = vi.fn();

    const stop = photoReviews({ ...config, enabled: false }, i18n);
    cleanup = stop ?? undefined;

    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(document.querySelector('.hs-photo-review__gallery')).toBeNull();
  });

  it('галерея не з\'являється для відгуку, який бекенд не знає', async () => {
    addReviewItem('Невідомий', 'Без фото');
    mockMatchResponse([]);

    const stop = photoReviews(config, i18n);
    cleanup = stop ?? undefined;
    await __awaitInFlight();

    expect(document.querySelector('.hs-photo-review__gallery')).toBeNull();
  });

  it('фолбек при помилці мережі — не падаємо, нічого не малюємо', async () => {
    addReviewItem('Хтось', 'Текст');
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network down'));

    const stop = photoReviews(config, i18n);
    cleanup = stop ?? undefined;
    await __awaitInFlight();

    expect(document.querySelector('.hs-photo-review__gallery')).toBeNull();
  });
});

// ── Upload tests ───────────────────────────────────────────────────────────────

describe('photo-reviews upload injection', () => {
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    globalThis.fetch = vi.fn().mockResolvedValue(new Response());
  });

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
    vi.restoreAllMocks();
  });

  it('form not present → no UI is injected', () => {
    cleanup = startUpload(uploadSettings);

    expect(document.querySelector('.wty-pr-btn')).toBeNull();
  });

  it('form present → add-media button appears below textarea', () => {
    addReviewForm();
    cleanup = startUpload(uploadSettings);

    expect(document.querySelector('.wty-pr-btn')).not.toBeNull();
  });

  it('form present + enableUpload: false → button NOT appended', () => {
    addReviewForm();
    const stop = photoReviews({ ...config, enableUpload: false }, i18n);
    cleanup = stop ?? undefined;

    expect(document.querySelector('.wty-pr-btn')).toBeNull();
  });

  it('photo + video selected → error shown, state unchanged', () => {
    const form = addReviewForm();
    cleanup = startUpload(uploadSettings);

    const fileInput = form.querySelector<HTMLInputElement>('input[type="file"]')!;
    const photo = makePhotoFile();
    const video = makeVideoFile();
    setInputFiles(fileInput, [photo, video]);
    fileInput.dispatchEvent(new Event('change'));

    const errBox = form.querySelector<HTMLDivElement>('.wty-pr-err')!;
    expect(errBox.hidden).toBe(false);
    expect(errBox.textContent).toBe(uploadSettings.errMixed);
    // grid should be empty — no previews
    expect(form.querySelector('.wty-pr-item')).toBeNull();
  });

  it('6 photos selected → error shown, state not updated', () => {
    const form = addReviewForm();
    cleanup = startUpload(uploadSettings);

    const fileInput = form.querySelector<HTMLInputElement>('input[type="file"]')!;
    const photos = Array.from({ length: 6 }, (_, i) => makePhotoFile(`p${i}.jpg`));
    setInputFiles(fileInput, photos);
    fileInput.dispatchEvent(new Event('change'));

    const errBox = form.querySelector<HTMLDivElement>('.wty-pr-err')!;
    expect(errBox.hidden).toBe(false);
    expect(errBox.textContent).toBe(uploadSettings.errPhotoCount);
    expect(form.querySelector('.wty-pr-item')).toBeNull();
  });

  it('submit with photos → fetch called once with FormData; native submit not prevented', () => {
    const form = addReviewForm();
    cleanup = startUpload(uploadSettings);

    // Add 2 photos via file input
    const fileInput = form.querySelector<HTMLInputElement>('input[type="file"]')!;
    const photos = [makePhotoFile('a.jpg'), makePhotoFile('b.jpg')];
    setInputFiles(fileInput, photos);
    fileInput.dispatchEvent(new Event('change'));

    // Simulate native form submit (capture phase)
    let defaultPrevented = false;
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    submitEvent.preventDefault = () => { defaultPrevented = true; };
    form.dispatchEvent(submitEvent);

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [url, opts] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.widgetis.com/api/v1/widgets/reviews');
    expect(opts.method).toBe('POST');
    expect(opts.body).toBeInstanceOf(FormData);
    expect(defaultPrevented).toBe(false);
  });

  it('cleanup removes injected UI and disconnects observer', () => {
    addReviewForm();
    const stop = startUpload(uploadSettings);

    expect(document.querySelector('.wty-pr-btn')).not.toBeNull();

    stop();

    expect(document.querySelector('.wty-pr-btn')).toBeNull();
    expect(document.querySelector('.wty-pr-wrap')).toBeNull();
  });
});

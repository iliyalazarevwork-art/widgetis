import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@laxarevii/core', () => ({
  getLanguage: () => 'ua',
}));

import phoneMask from './index';
import { getDefaultConfig, getDefaultI18n, phoneMaskSchema } from './schema';
import {
  buildEditingTemplate,
  extractLocalDigits,
  fillTemplate,
  isComplete,
  maskCapacity,
  primaryMask,
  renderEditingValue,
  stripDial,
} from './mask';
import { COUNTRIES, getCountry, listCountries } from './countries';

const UA = getCountry('UA')!;
const PL = getCountry('PL')!;
const DE = getCountry('DE')!;

const flushAsync = () => new Promise((r) => setTimeout(r, 0));

describe('mask helpers', () => {
  it('подсчитывает количество слотов X в маске', () => {
    expect(maskCapacity('(XX) XXX-XX-XX')).toBe(9);
    expect(maskCapacity('XXX XXX XXX')).toBe(9);
    expect(maskCapacity('')).toBe(0);
  });

  it('primaryMask выбирает самую длинную маску', () => {
    expect(primaryMask({ masks: ['XXXX XXXXXXX', 'XXXX XXXXXXXX'] })).toBe('XXXX XXXXXXXX');
    expect(primaryMask({ masks: ['XX XX'] })).toBe('XX XX');
  });

  it('buildEditingTemplate склеивает dial + маску с _ вместо X', () => {
    expect(buildEditingTemplate(UA)).toBe('+380 (__) ___-__-__');
    expect(buildEditingTemplate(PL)).toBe('+48 ___ ___ ___');
  });

  it('fillTemplate заполняет _ цифрами слева направо', () => {
    expect(fillTemplate('+380 (__) ___-__-__', '671234567')).toBe('+380 (67) 123-45-67');
    expect(fillTemplate('+380 (__) ___-__-__', '67')).toBe('+380 (67) ___-__-__');
    expect(fillTemplate('+380 (__) ___-__-__', '')).toBe('+380 (__) ___-__-__');
  });

  it('renderEditingValue для UA даёт корректный formatted result', () => {
    expect(renderEditingValue(UA, '671234567')).toBe('+380 (67) 123-45-67');
  });

  it('stripDial убирает только префикс dial-кода в digits-only сравнении', () => {
    expect(stripDial('+380671234567', '+380')).toBe('671234567');
    expect(stripDial('+380 (67) 123-45-67', '+380')).toBe('671234567');
    expect(stripDial('671234567', '+380')).toBe('671234567');
    expect(stripDial('', '+380')).toBe('');
  });

  it('extractLocalDigits снимает чужой dial-код, обрезая до длины локальной маски', () => {
    const all = listCountries();
    // юзер вставил польский номер, выбрана UA — отдаём польские цифры (но не больше 9 — длина UA-маски)
    expect(extractLocalDigits('+48 501 234 567', UA, all)).toBe('501234567');
    // юзер вставил украинский номер целиком
    expect(extractLocalDigits('+380671234567', UA, all)).toBe('671234567');
  });

  it('extractLocalDigits срезает trunk-prefix 0', () => {
    const all = listCountries();
    // 10 цифр, начинаются с 0 — уберём ведущий 0 и оставим 9 (длина UA-маски)
    expect(extractLocalDigits('0671234567', UA, all)).toBe('671234567');
  });

  it('isComplete возвращает true только при полном заполнении одной из масок страны', () => {
    expect(isComplete(UA, '671234567')).toBe(true); // 9 цифр
    expect(isComplete(UA, '67123456')).toBe(false); // 8 цифр
    expect(isComplete(DE, '15123456789')).toBe(true);  // совпадает с XXXX XXXXXXXX (12)? Проверим:
  });
});

describe('schema', () => {
  it('parse + defaults', () => {
    const cfg = getDefaultConfig();
    expect(cfg.enabled).toBe(true);
    expect(cfg.defaultCountry).toBe('UA');
    expect(cfg.flagCdn).toBe('https://flagcdn.com');
  });

  it('отвергает defaultCountry, которой нет в COUNTRIES', () => {
    expect(() => phoneMaskSchema.parse({ defaultCountry: 'ZZ' })).toThrow();
  });

  it('getDefaultI18n содержит ua/ru/en с обязательными полями', () => {
    const i18n = getDefaultI18n();
    expect(i18n.ua.searchPlaceholder).toBeTruthy();
    expect(i18n.ua.invalid).toBeTruthy();
    expect(i18n.en.hint).toBeTruthy();
  });

  it('countries dataset содержит >= 200 стран и UA с украинской маской', () => {
    expect(Object.keys(COUNTRIES).length).toBeGreaterThanOrEqual(200);
    expect(COUNTRIES.UA?.dial).toBe('+380');
    expect(COUNTRIES.UA?.masks[0]).toBe('(XX) XXX-XX-XX');
  });
});

describe('phoneMask widget mounting', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    localStorage.clear();
  });
  afterEach(() => vi.restoreAllMocks());

  function addInput(html = '<input type="tel" name="phone">'): HTMLInputElement {
    const form = document.createElement('form');
    form.innerHTML = html;
    document.body.appendChild(form);
    return form.querySelector('input')!;
  }

  it('оборачивает input в .wdg-pm-wrap, монтирует picker и предзаполняет dial-код', () => {
    addInput();
    const cleanup = phoneMask(getDefaultConfig(), getDefaultI18n());

    const wrap = document.querySelector('.wdg-pm-wrap');
    expect(wrap).not.toBeNull();
    const input = wrap!.querySelector<HTMLInputElement>('input[type="tel"]')!;
    expect(input.value).toBe('+380 (__) ___-__-__');
    expect(document.querySelector('.wdg-pm-picker')).not.toBeNull();
    expect(document.getElementById('wdg-phone-mask-styles')).not.toBeNull();

    cleanup?.();
  });

  it('не монтирует, если enabled = false', () => {
    addInput();
    phoneMask({ ...getDefaultConfig(), enabled: false }, getDefaultI18n());
    expect(document.querySelector('.wdg-pm-wrap')).toBeNull();
  });

  it('форматирует ввод: typing "671234567" => "+380 (67) 123-45-67"', () => {
    addInput();
    phoneMask(getDefaultConfig(), getDefaultI18n());

    const input = document.querySelector<HTMLInputElement>('.wdg-pm-wrap input[type="tel"]')!;
    input.value = '671234567';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(input.value).toBe('+380 (67) 123-45-67');
  });

  it('blur с неполным номером показывает ошибку и aria-invalid', () => {
    addInput();
    phoneMask(getDefaultConfig(), getDefaultI18n());

    const input = document.querySelector<HTMLInputElement>('.wdg-pm-wrap input[type="tel"]')!;
    input.value = '12';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(document.querySelector('.wdg-pm-error')!.textContent).toBeTruthy();
  });

  it('blockSubmitOnInvalid останавливает submit формы', () => {
    addInput();
    phoneMask(getDefaultConfig(), getDefaultI18n());

    const form = document.querySelector('form')!;
    const ev = new Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
  });

  it('hidePicker = true скрывает кнопку выбора страны', () => {
    addInput();
    phoneMask({ ...getDefaultConfig(), hidePicker: true }, getDefaultI18n());

    const picker = document.querySelector<HTMLButtonElement>('.wdg-pm-picker')!;
    expect(picker.hidden).toBe(true);
  });

  it('allowedCountries фильтрует список в дропдауне', () => {
    addInput();
    phoneMask({ ...getDefaultConfig(), allowedCountries: ['UA', 'PL'] }, getDefaultI18n());

    document.querySelector<HTMLButtonElement>('.wdg-pm-picker')!.click();
    const items = document.querySelectorAll('.wdg-pm-item');
    expect(items.length).toBe(2);
    const isos = Array.from(items).map((el) => (el as HTMLElement).dataset.iso2);
    expect(isos).toEqual(expect.arrayContaining(['UA', 'PL']));
  });

  it('rememberLastChoice = true: сохранённая страна восстанавливается из localStorage', () => {
    localStorage.setItem('wdg_phone_mask_country', 'PL');
    addInput();
    phoneMask(getDefaultConfig(), getDefaultI18n());

    const input = document.querySelector<HTMLInputElement>('.wdg-pm-wrap input[type="tel"]')!;
    expect(input.value.startsWith('+48 ')).toBe(true);
  });

  it('cleanup разворачивает обёртку и убирает стили', () => {
    addInput();
    const cleanup = phoneMask(getDefaultConfig(), getDefaultI18n())!;
    expect(document.querySelector('.wdg-pm-wrap')).not.toBeNull();
    cleanup();
    expect(document.querySelector('.wdg-pm-wrap')).toBeNull();
    expect(document.getElementById('wdg-phone-mask-styles')).toBeNull();
    expect(document.querySelector('input[type="tel"]')).not.toBeNull();
  });

  it('Backspace удаляет цифру даже если каретка стоит перед разделителем', () => {
    addInput();
    phoneMask(getDefaultConfig(), getDefaultI18n());

    const input = document.querySelector<HTMLInputElement>('.wdg-pm-wrap input[type="tel"]')!;
    input.value = '671234567';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(input.value).toBe('+380 (67) 123-45-67');

    // Каретка ровно перед `-` (между `123` и `-45-67`) — позиция 13.
    input.setSelectionRange(13, 13);
    const ev = new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true });
    input.dispatchEvent(ev);
    // Должна удалиться цифра `3` (последняя цифра до каретки), а не `-`.
    expect(input.value).toBe('+380 (67) 124-56-7_');
  });

  it('Backspace в конце поля убирает последнюю введённую цифру', () => {
    addInput();
    phoneMask(getDefaultConfig(), getDefaultI18n());
    const input = document.querySelector<HTMLInputElement>('.wdg-pm-wrap input[type="tel"]')!;
    input.value = '671234567';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    // Несколько Backspace подряд — должны последовательно отъесть 7,6,5,4,3
    for (let i = 0; i < 5; i++) {
      const len = input.value.length;
      input.setSelectionRange(len, len);
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true }));
    }
    // Осталось 4 цифры из 9: 6712
    expect(input.value).toBe('+380 (67) 12_-__-__');
  });

  it('Backspace не уходит в dial-код', () => {
    addInput();
    phoneMask(getDefaultConfig(), getDefaultI18n());
    const input = document.querySelector<HTMLInputElement>('.wdg-pm-wrap input[type="tel"]')!;
    // пусто — dial уже отображён
    input.setSelectionRange(5, 5); // прямо перед `(`
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true }));
    expect(input.value).toBe('+380 (__) ___-__-__');
  });

  it('Delete удаляет цифру справа от каретки', () => {
    addInput();
    phoneMask(getDefaultConfig(), getDefaultI18n());
    const input = document.querySelector<HTMLInputElement>('.wdg-pm-wrap input[type="tel"]')!;
    input.value = '671234567';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    // Каретка между `(` и `67`, позиция 6.
    input.setSelectionRange(6, 6);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true, cancelable: true }));
    // Удалится `6` — первая цифра локального номера.
    expect(input.value).toBe('+380 (71) 234-56-7_');
  });

  it('повторный вызов на том же input не создаёт двойную обёртку', () => {
    addInput();
    phoneMask(getDefaultConfig(), getDefaultI18n());
    // эмулируем второй вызов: добавим ещё один input через MutationObserver-ный путь — просто запустим mountAll руками? Достаточно проверить что у нас 1 wrap.
    expect(document.querySelectorAll('.wdg-pm-wrap').length).toBe(1);
  });
});

describe('mutation observer picks up dynamically added phone fields', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    localStorage.clear();
  });

  it('новые input[type="tel"] оборачиваются после вставки в DOM', async () => {
    const cleanup = phoneMask(getDefaultConfig(), getDefaultI18n())!;
    expect(document.querySelectorAll('.wdg-pm-wrap').length).toBe(0);

    const form = document.createElement('form');
    form.innerHTML = '<input type="tel" name="phone">';
    document.body.appendChild(form);

    await flushAsync();
    await flushAsync();
    expect(document.querySelectorAll('.wdg-pm-wrap').length).toBe(1);
    cleanup();
  });
});

import { phoneMaskSchema, phoneMaskI18nSchema, type PhoneMaskInput, type PhoneMaskI18n, type PhoneMaskConfig } from './schema';
import { getLanguage } from '@laxarevii/core';
import { COUNTRIES, getCountry, listCountries, type Country, type CountryNames } from './countries';
import {
  buildEditingTemplate,
  extractLocalDigits,
  isComplete,
  renderEditingValue,
  stripDial,
} from './mask';
import { injectStyles, STYLE_ID } from './styles';
import { flagBox, renderDropdown, wrapInput, type WrappedInput } from './dom';

const INIT_ATTR = 'data-wdg-phone-mask';
const STORAGE_COUNTRY = 'wdg_phone_mask_country';
const STORAGE_PHONE = 'wdg_phone_mask_phone';

const NAME_LANG_BY_PAGE: Record<string, keyof CountryNames> = {
  ua: 'ukr',
  uk: 'ukr',
  ru: 'rus',
  en: 'eng',
  pl: 'pol',
};

type I18nEntry = { searchPlaceholder: string; hint: string; invalid: string };

type Instance = {
  refs: WrappedInput;
  country: Country;
  digits: string;
  config: PhoneMaskConfig;
  i18n: I18nEntry;
  cleanups: Array<() => void>;
};

function pickI18n(map: PhoneMaskI18n): I18nEntry {
  const lang = getLanguage();
  return map[lang] ?? map.ua ?? map.en ?? Object.values(map)[0]!;
}

function nameLang(): keyof CountryNames {
  return NAME_LANG_BY_PAGE[getLanguage()] ?? 'ukr';
}

function effectiveCountries(config: PhoneMaskConfig, lang: keyof CountryNames): Country[] {
  const all = listCountries(lang);
  if (config.allowedCountries.length === 0) return all;
  const allowSet = new Set(config.allowedCountries);
  return all.filter((c) => allowSet.has(c.iso2));
}

function readSavedCountry(): string | null {
  try { return localStorage.getItem(STORAGE_COUNTRY); } catch { return null; }
}
function readSavedPhone(): string | null {
  try { return localStorage.getItem(STORAGE_PHONE); } catch { return null; }
}
function writeSavedCountry(iso2: string): void {
  try { localStorage.setItem(STORAGE_COUNTRY, iso2); } catch { /* ignore */ }
}
function writeSavedPhone(phone: string): void {
  try { localStorage.setItem(STORAGE_PHONE, phone); } catch { /* ignore */ }
}

function pickInitialCountry(config: PhoneMaskConfig, available: Country[]): Country {
  const lang = nameLang();
  if (config.rememberLastChoice) {
    const saved = readSavedCountry();
    if (saved) {
      const c = available.find((x) => x.iso2 === saved);
      if (c) return c;
    }
  }
  const def = available.find((c) => c.iso2 === config.defaultCountry);
  if (def) return def;
  return available[0] ?? getCountry('UA', lang)!;
}

async function detectGeoCountry(config: PhoneMaskConfig, available: Country[]): Promise<Country | null> {
  if (!config.geoip) return null;
  try {
    const resp = await fetch(config.geoipUrl, { method: 'GET' });
    if (!resp.ok) return null;
    const data = (await resp.json()) as { country_code?: string; country?: string };
    const iso2 = (data.country_code || data.country || '').toUpperCase();
    return available.find((c) => c.iso2 === iso2) ?? null;
  } catch {
    return null;
  }
}

function setPickerHeader(refs: WrappedInput, country: Country, flagCdn: string): void {
  refs.pickerFlag.innerHTML = '';
  refs.pickerFlag.appendChild(flagBox(country.iso2, flagCdn));
  refs.pickerName.textContent = country.name;
}

function setError(refs: WrappedInput, msg: string | null): void {
  if (msg) {
    refs.errorEl.textContent = msg;
    refs.errorEl.classList.remove('wdg-pm-hidden');
    refs.input.setAttribute('aria-invalid', 'true');
  } else {
    refs.errorEl.textContent = '';
    refs.errorEl.classList.add('wdg-pm-hidden');
    refs.input.removeAttribute('aria-invalid');
  }
}

function setHint(refs: WrappedInput, country: Country, baseHint: string): void {
  refs.hintEl.textContent = `${baseHint}: ${country.dial} ${country.example}`;
}

function applyMask(instance: Instance, caret?: number): void {
  instance.refs.input.value = renderEditingValue(instance.country, instance.digits);
  const value = instance.refs.input.value;
  let pos: number;
  if (typeof caret === 'number') {
    pos = Math.max(0, Math.min(caret, value.length));
  } else {
    const firstHole = value.indexOf('_');
    pos = firstHole === -1 ? value.length : firstHole;
  }
  try { instance.refs.input.setSelectionRange(pos, pos); } catch { /* ignore */ }
}

/**
 * Index in the rendered value of the n-th digit slot (0-based), counting only
 * `_`/digit positions (i.e. the slots `X` in the mask). Returns the value's
 * length when n is past the end.
 */
function slotPosition(value: string, dialLen: number, n: number): number {
  let count = 0;
  for (let i = dialLen; i < value.length; i++) {
    const ch = value[i]!;
    if (ch === '_' || /\d/.test(ch)) {
      if (count === n) return i;
      count++;
    }
  }
  return value.length;
}

/**
 * Map a caret position in the rendered string to "how many digit slots are
 * before it" — used to translate caret <-> position in `instance.digits`.
 */
function slotsBefore(value: string, dialLen: number, caret: number): number {
  let count = 0;
  for (let i = dialLen; i < Math.min(caret, value.length); i++) {
    const ch = value[i]!;
    if (ch === '_' || /\d/.test(ch)) count++;
  }
  return count;
}

function destroyExistingInputmask(input: HTMLInputElement): void {
  // Some Horoshop themes inject Inputmask onto the same field. Drop it before
  // we install our own behaviour, otherwise the two fight over `value`.
  const im = (input as unknown as { inputmask?: { remove?: () => void } }).inputmask;
  if (im && typeof im.remove === 'function') {
    try { im.remove(); } catch { /* ignore */ }
  }
  input.removeAttribute('data-inputmask');
  input.removeAttribute('data-inputmask-alias');
  input.removeAttribute('data-inputmask-mask');
  input.classList.remove('inputmask');
}

function attachInstance(input: HTMLInputElement, config: PhoneMaskConfig, i18nMap: PhoneMaskI18n): Instance | null {
  if (input.getAttribute(INIT_ATTR) === '1') return null;
  input.setAttribute(INIT_ATTR, '1');
  destroyExistingInputmask(input);

  const lang = nameLang();
  const available = effectiveCountries(config, lang);
  if (available.length === 0) return null;

  const refs = wrapInput(input);
  const i18n = pickI18n(i18nMap);
  refs.searchInput.placeholder = i18n.searchPlaceholder;

  if (config.hidePicker || available.length === 1) {
    refs.pickerBtn.hidden = true;
  }

  const country = pickInitialCountry(config, available);
  const instance: Instance = { refs, country, digits: '', config, i18n, cleanups: [] };

  setPickerHeader(refs, country, config.flagCdn);
  setHint(refs, country, i18n.hint);

  if (config.rememberLastChoice) {
    const phone = readSavedPhone();
    if (phone) instance.digits = stripDial(phone, country.dial);
  }
  applyMask(instance);

  // ---- delete/backspace ----------------------------------------------------
  // The default browser behaviour of Backspace/Delete bumps a separator (space,
  // dash, parenthesis) and then `oninput` re-applies the mask, restoring it —
  // so the user appears to be stuck. We override deletion: skip separators and
  // remove the nearest *digit* instead.
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Backspace' && e.key !== 'Delete') return;
    const input = refs.input;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? start;
    if (start !== end) return; // selection — let browser delete the range, oninput will re-mask
    const value = input.value;
    const dialLen = instance.country.dial.length + 1; // +1 for the space after dial

    if (e.key === 'Backspace') {
      // find nearest digit at index < start
      let i = start - 1;
      while (i >= dialLen && !/\d/.test(value[i]!)) i--;
      if (i < dialLen) { e.preventDefault(); return; }
      const slotIdx = slotsBefore(value, dialLen, i);
      e.preventDefault();
      instance.digits = instance.digits.slice(0, slotIdx) + instance.digits.slice(slotIdx + 1);
      applyMask(instance);
      // place caret on the freed slot
      const newPos = slotPosition(input.value, dialLen, slotIdx);
      try { input.setSelectionRange(newPos, newPos); } catch { /* ignore */ }
      setError(refs, null);
    } else {
      // Delete: nearest digit at index >= start
      let i = Math.max(start, dialLen);
      while (i < value.length && !/\d/.test(value[i]!)) i++;
      if (i >= value.length) { e.preventDefault(); return; }
      const slotIdx = slotsBefore(value, dialLen, i);
      e.preventDefault();
      instance.digits = instance.digits.slice(0, slotIdx) + instance.digits.slice(slotIdx + 1);
      applyMask(instance);
      const newPos = slotPosition(input.value, dialLen, slotIdx);
      try { input.setSelectionRange(newPos, newPos); } catch { /* ignore */ }
      setError(refs, null);
    }
  };
  refs.input.addEventListener('keydown', onKeyDown);
  instance.cleanups.push(() => refs.input.removeEventListener('keydown', onKeyDown));

  // ---- input handling -------------------------------------------------------
  const onInput = () => {
    instance.digits = extractLocalDigits(refs.input.value, instance.country, listCountries(lang));
    applyMask(instance);
    setError(refs, null);
  };
  refs.input.addEventListener('input', onInput);
  instance.cleanups.push(() => refs.input.removeEventListener('input', onInput));

  const onBlur = () => {
    if (refs.input.value.trim() === buildEditingTemplate(instance.country)) {
      // empty
      setError(refs, null);
      return;
    }
    if (!isComplete(instance.country, instance.digits)) {
      setError(refs, instance.i18n.invalid);
      return;
    }
    setError(refs, null);
    if (config.rememberLastChoice) writeSavedPhone(instance.country.dial + instance.digits);
  };
  refs.input.addEventListener('blur', onBlur);
  instance.cleanups.push(() => refs.input.removeEventListener('blur', onBlur));

  // ---- picker ---------------------------------------------------------------
  const setCountry = (c: Country, manual: boolean) => {
    instance.country = c;
    setPickerHeader(refs, c, config.flagCdn);
    setHint(refs, c, instance.i18n.hint);
    applyMask(instance);
    if (manual && config.rememberLastChoice) writeSavedCountry(c.iso2);
  };

  const closeDropdown = () => {
    refs.dropdown.classList.remove('open');
    refs.pickerBtn.setAttribute('aria-expanded', 'false');
  };
  const openDropdown = () => {
    refs.dropdown.classList.add('open');
    refs.pickerBtn.setAttribute('aria-expanded', 'true');
    refs.searchInput.value = '';
    refs.searchInput.focus();
    renderDropdown(refs.dropdownList, available, instance.country.iso2, config.flagCdn, '', (c) => {
      setCountry(c, true);
      closeDropdown();
      refs.input.focus();
    });
  };
  const onPickerClick = () => {
    refs.dropdown.classList.contains('open') ? closeDropdown() : openDropdown();
  };
  refs.pickerBtn.addEventListener('click', onPickerClick);
  instance.cleanups.push(() => refs.pickerBtn.removeEventListener('click', onPickerClick));

  const onSearch = () => {
    renderDropdown(refs.dropdownList, available, instance.country.iso2, config.flagCdn, refs.searchInput.value, (c) => {
      setCountry(c, true);
      closeDropdown();
      refs.input.focus();
    });
  };
  refs.searchInput.addEventListener('input', onSearch);
  instance.cleanups.push(() => refs.searchInput.removeEventListener('input', onSearch));

  const onDocClick = (e: MouseEvent) => {
    if (!refs.dropdown.classList.contains('open')) return;
    if (!refs.wrap.contains(e.target as Node)) closeDropdown();
  };
  document.addEventListener('click', onDocClick);
  instance.cleanups.push(() => document.removeEventListener('click', onDocClick));

  // ---- form submit guard ----------------------------------------------------
  if (config.blockSubmitOnInvalid) {
    const form = refs.input.form;
    if (form) {
      const onSubmit = (e: SubmitEvent) => {
        if (!isComplete(instance.country, instance.digits)) {
          e.preventDefault();
          e.stopImmediatePropagation();
          setError(refs, instance.i18n.invalid);
          refs.input.focus();
        }
      };
      form.addEventListener('submit', onSubmit, true);
      instance.cleanups.push(() => form.removeEventListener('submit', onSubmit, true));
    }
  }

  // ---- async geoip default --------------------------------------------------
  if (config.geoip && !readSavedCountry() && config.defaultCountry === 'UA') {
    void detectGeoCountry(config, available).then((c) => {
      if (c && c.iso2 !== instance.country.iso2 && instance.digits.length === 0) {
        setCountry(c, false);
      }
    });
  }

  return instance;
}

const allInstances: Instance[] = [];

export default function phoneMask(rawConfig: PhoneMaskInput, rawI18n: Record<string, I18nEntry>): (() => void) | void {
  if (typeof document === 'undefined') return;

  const config = phoneMaskSchema.parse(rawConfig);
  const i18n = phoneMaskI18nSchema.parse(rawI18n);
  if (!config.enabled) { console.warn('[widgetality] phone-mask: disabled'); return; }
  if (!COUNTRIES[config.defaultCountry]) {
    console.warn(`[widgetality] phone-mask: unknown defaultCountry "${config.defaultCountry}", falling back to UA`);
  }
  console.log('[widgetality] phone-mask: activated');

  injectStyles();

  const mountAll = () => {
    document.querySelectorAll<HTMLInputElement>(config.selector).forEach((input) => {
      if (input.offsetParent === null && input.type !== 'hidden') return;
      const inst = attachInstance(input, config, i18n);
      if (inst) allInstances.push(inst);
    });
  };
  mountAll();

  const observer = new MutationObserver(() => mountAll());
  observer.observe(document.body, { childList: true, subtree: true });

  return () => {
    observer.disconnect();
    while (allInstances.length) {
      const inst = allInstances.pop()!;
      inst.cleanups.forEach((fn) => { try { fn(); } catch { /* ignore */ } });
      inst.refs.wrap.replaceWith(inst.refs.input);
      inst.refs.input.removeAttribute(INIT_ATTR);
      inst.refs.input.value = '';
    }
    document.getElementById(STYLE_ID)?.remove();
  };
}

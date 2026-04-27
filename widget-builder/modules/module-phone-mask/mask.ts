import type { Country } from './countries';

/** Number of digit slots (`X` chars) in a mask template. */
export function maskCapacity(mask: string): number {
  const m = mask.match(/X/g);
  return m ? m.length : 0;
}

/** Pick the longest mask of the country (so it can hold any valid number). */
export function primaryMask(country: Pick<Country, 'masks'>): string {
  if (country.masks.length === 0) return '';
  return country.masks.reduce((acc, cur) => (maskCapacity(cur) > maskCapacity(acc) ? cur : acc));
}

/** Editing template: dial code + space + mask with `X` replaced by `_`. */
export function buildEditingTemplate(country: Pick<Country, 'dial' | 'masks'>): string {
  return `${country.dial} ${primaryMask(country).replace(/X/g, '_')}`;
}

/**
 * Pour user-typed digits into the `_` slots of a template, left-to-right.
 * Extra digits are dropped; missing digits keep their `_` placeholders.
 */
export function fillTemplate(template: string, digits: string): string {
  const out = template.split('');
  let di = 0;
  for (let i = 0; i < out.length && di < digits.length; i++) {
    if (out[i] === '_') {
      out[i] = digits[di]!;
      di++;
    }
  }
  return out.join('');
}

/** Render the editable string for `localDigits` typed in the given `country`. */
export function renderEditingValue(country: Pick<Country, 'dial' | 'masks'>, localDigits: string): string {
  return fillTemplate(buildEditingTemplate(country), localDigits);
}

/**
 * Strip the country dial code from a raw input (digits-only comparison).
 * Returns the local part (digits only).
 */
export function stripDial(value: string, dial: string): string {
  if (!value) return '';
  const v = value.replace(/\D/g, '');
  const d = dial.replace(/\D/g, '');
  return v.startsWith(d) ? v.substring(d.length) : v;
}

/**
 * Best-effort: take a raw value (possibly pasted with another country's dial,
 * a leading 0 trunk prefix, or junk), and extract just the local digits for
 * the *currently selected* country.
 *
 * Algorithm: scan all countries; if the value starts with one of their dials,
 * strip it. Otherwise strip a leading 0 if it would line up with the mask
 * length, else take the trailing N digits (where N is the mask capacity).
 */
export function extractLocalDigits(
  value: string,
  selected: Pick<Country, 'masks'>,
  allCountries: ReadonlyArray<Pick<Country, 'dial'>>,
): string {
  if (!value) return '';
  let digits = value.replace(/\D/g, '');
  const max = maskCapacity(primaryMask(selected));

  for (const c of allCountries) {
    const d = c.dial.replace(/\D/g, '');
    if (d && digits.startsWith(d)) {
      digits = digits.substring(d.length);
      return digits.slice(0, max || digits.length);
    }
  }

  if (max && digits.length > max) {
    if (digits.charAt(0) === '0' && digits.length - 1 === max) {
      digits = digits.substring(1);
    } else {
      digits = digits.substring(digits.length - max);
    }
  }
  return digits;
}

/** True if the local digits exactly fill *some* mask of the country. */
export function isComplete(country: Pick<Country, 'masks'>, localDigits: string): boolean {
  if (country.masks.length === 0) return localDigits.length > 0;
  return country.masks.some((m) => maskCapacity(m) === localDigits.length);
}

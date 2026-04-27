import type { Country } from './countries';

export function flagBox(iso2: string, flagCdn: string): HTMLSpanElement {
  const wrap = document.createElement('span');
  wrap.className = 'wdg-pm-flagbox';
  const img = document.createElement('img');
  img.className = 'wdg-pm-flagimg';
  img.src = `${flagCdn}/24x18/${iso2.toLowerCase()}.png`;
  img.alt = iso2;
  img.loading = 'lazy';
  img.onerror = () => {
    wrap.innerHTML = `<span class="wdg-pm-flag-emoji">${iso2ToFlagEmoji(iso2)}</span>`;
  };
  wrap.appendChild(img);
  return wrap;
}

export function iso2ToFlagEmoji(iso2: string): string {
  return iso2
    .toUpperCase()
    .replace(/./g, (ch) => String.fromCodePoint(127397 + ch.charCodeAt(0)));
}

export type WrappedInput = {
  wrap: HTMLDivElement;
  input: HTMLInputElement;
  pickerBtn: HTMLButtonElement;
  pickerFlag: HTMLSpanElement;
  pickerName: HTMLSpanElement;
  dropdown: HTMLDivElement;
  dropdownList: HTMLDivElement;
  searchInput: HTMLInputElement;
  hintEl: HTMLDivElement;
  errorEl: HTMLDivElement;
};

export function wrapInput(input: HTMLInputElement): WrappedInput {
  const wrap = document.createElement('div');
  wrap.className = 'wdg-pm-wrap';

  const pickerBtn = document.createElement('button');
  pickerBtn.type = 'button';
  pickerBtn.className = 'wdg-pm-picker';
  pickerBtn.setAttribute('aria-haspopup', 'listbox');
  pickerBtn.setAttribute('aria-expanded', 'false');

  const pickerFlag = document.createElement('span');
  const pickerName = document.createElement('span');
  pickerName.className = 'wdg-pm-name';
  pickerBtn.appendChild(pickerFlag);
  pickerBtn.appendChild(pickerName);

  const dropdown = document.createElement('div');
  dropdown.className = 'wdg-pm-dd';
  dropdown.setAttribute('role', 'listbox');
  dropdown.setAttribute('tabindex', '-1');

  const search = document.createElement('div');
  search.className = 'wdg-pm-search';
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  search.appendChild(searchInput);

  const dropdownList = document.createElement('div');
  dropdown.appendChild(search);
  dropdown.appendChild(dropdownList);

  const inputBox = document.createElement('div');
  inputBox.className = 'wdg-pm-input';

  input.parentNode!.insertBefore(wrap, input);
  inputBox.appendChild(input);

  // .wdg-pm-row держит [picker][input] в одну строку.
  // hint и error выносим на уровень .wdg-pm-wrap, чтобы они занимали ВСЮ
  // ширину под строкой, а не только ширину input.
  const row = document.createElement('div');
  row.className = 'wdg-pm-row';
  row.appendChild(pickerBtn);
  row.appendChild(inputBox);
  row.appendChild(dropdown);

  const hintEl = document.createElement('div');
  hintEl.className = 'wdg-pm-hint';

  const errorEl = document.createElement('div');
  errorEl.className = 'wdg-pm-error wdg-pm-hidden';

  wrap.appendChild(row);
  wrap.appendChild(hintEl);
  wrap.appendChild(errorEl);

  return { wrap, input, pickerBtn, pickerFlag, pickerName, dropdown, dropdownList, searchInput, hintEl, errorEl };
}

export function renderDropdown(
  list: HTMLDivElement,
  countries: ReadonlyArray<Country>,
  selectedIso2: string,
  flagCdn: string,
  query: string,
  onPick: (c: Country) => void,
): void {
  const q = query.trim().toLowerCase();
  list.innerHTML = '';
  countries
    .filter((c) => {
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.iso2.toLowerCase().includes(q) ||
        c.dial.replace(/\s+/g, '').includes(q.replace(/\s+/g, ''))
      );
    })
    .forEach((c) => {
      const item = document.createElement('div');
      item.className = 'wdg-pm-item';
      item.setAttribute('role', 'option');
      item.dataset.iso2 = c.iso2;

      const flag = flagBox(c.iso2, flagCdn);
      flag.classList.add('wdg-pm-dd-flag');

      const title = document.createElement('div');
      title.className = 'wdg-pm-dd-title';
      const line1 = document.createElement('div');
      line1.className = 'wdg-pm-dd-line1';
      line1.textContent = `${c.name}   ${c.dial}`;
      title.appendChild(line1);

      item.appendChild(flag);
      item.appendChild(title);
      if (c.iso2 === selectedIso2) item.setAttribute('aria-selected', 'true');
      item.addEventListener('click', () => onPick(c));
      list.appendChild(item);
    });
}

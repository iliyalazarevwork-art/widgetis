type InsertMode = 'before' | 'after';

const ICON_USERS = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>`;

export function formatCount(count: number): string {
  if (count <= 20) return String(count);
  return `${Math.floor(count / 10) * 10}+`;
}

export function createBadge(
  count: number,
  label: string,
): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'sp-wrapper';

  wrapper.innerHTML = `
    <div class="sp-badge">
      <span class="sp-badge__icon">${ICON_USERS}</span>
      <span class="sp-badge__count">${formatCount(count)}</span>
      <span class="sp-badge__label">${label}</span>
    </div>
  `;
  return wrapper;
}

export function insertElement(reference: Element, element: HTMLElement, mode: InsertMode): void {
  if (!reference.isConnected) return;

  const methods: Record<InsertMode, () => void> = {
    before: () => reference.insertAdjacentElement('beforebegin', element),
    after: () => reference.insertAdjacentElement('afterend', element),
  };

  (methods[mode] ?? methods.before)();
}

export function removeExisting(reference: Element): void {
  const container = reference.closest('div');
  container?.querySelectorAll('.sp-wrapper').forEach((el) => {
    if (!el.contains(reference)) el.remove();
  });
}

export function updateCount(wrapper: HTMLElement, count: number): void {
  const el = wrapper.querySelector('.sp-badge__count');
  if (el) el.textContent = formatCount(count);
}

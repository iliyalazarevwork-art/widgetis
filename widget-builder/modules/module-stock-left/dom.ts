type InsertMode = 'before' | 'after';

export function createBadge(count: number, label: string, unit: string): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'wty-stock-left-wrapper';

  wrapper.innerHTML = `
    <div class="wty-stock-left" role="status" aria-live="polite">
      <span class="wty-stock-left__dot" aria-hidden="true"></span>
      <span class="wty-stock-left__label">${label}</span>
      <span class="wty-stock-left__count">${count}</span>
      <span class="wty-stock-left__unit">${unit}</span>
    </div>
  `;
  return wrapper;
}

export function insertElement(reference: Element, element: HTMLElement, mode: InsertMode): void {
  if (!reference.isConnected) return;
  const method: InsertMode = mode === 'after' ? 'after' : 'before';
  const where = method === 'after' ? 'afterend' : 'beforebegin';
  reference.insertAdjacentElement(where, element);
}

export function removeExisting(reference: Element): void {
  const container = reference.closest('div') ?? document.body;
  container.querySelectorAll('.wty-stock-left-wrapper').forEach((el) => {
    if (!el.contains(reference)) el.remove();
  });
}

export function updateCount(wrapper: HTMLElement, count: number): void {
  const el = wrapper.querySelector('.wty-stock-left__count');
  if (el && el.textContent !== String(count)) {
    el.textContent = String(count);
    const badge = wrapper.querySelector('.wty-stock-left');
    if (badge) {
      badge.classList.remove('wty-stock-left--flash');
      void (badge as HTMLElement).offsetWidth;
      badge.classList.add('wty-stock-left--flash');
    }
  }
}

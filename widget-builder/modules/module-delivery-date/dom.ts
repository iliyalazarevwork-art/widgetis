type InsertMode = 'append' | 'before' | 'after';

const NOVA_POSHTA_LOGO = 'data:image/png;base64,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';

export function createBadge(prefix: string, dateString: string): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'product__group-item j-product-block dd-wrapper';
  wrapper.innerHTML = `
    <div class="dd-badge">
      <span class="dd-badge__icon">
        <img src="${NOVA_POSHTA_LOGO}" alt="Nova Poshta" loading="lazy" />
      </span>
      <span class="dd-badge__text">
        ${prefix}: <span class="dd-badge__date">${dateString}</span>
      </span>
    </div>
  `;
  return wrapper;
}

export function insertElement(reference: Element, element: HTMLElement, mode: InsertMode): void {
  if (!reference.isConnected) {
    throw new Error('Element is not connected to DOM');
  }

  const methods: Record<InsertMode, () => void> = {
    append: () => reference.appendChild(element),
    before: () => reference.insertAdjacentElement('beforebegin', element),
    after: () => reference.insertAdjacentElement('afterend', element),
  };

  (methods[mode] ?? methods.after)();
}

export function removeExistingBadges(reference: Element): void {
  const container = reference.closest('div');
  const existing = container?.querySelectorAll('.dd-wrapper');
  existing?.forEach((el) => {
    if (!el.contains(reference)) el.remove();
  });
}

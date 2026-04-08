const MAX_ELEMENTS_TO_CHECK = 200;

export function hasTopCollision(self: HTMLElement, threshold = 0.2): boolean {
  const rect = self.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return false;

  const selfArea = rect.width * rect.height;
  if (selfArea <= 0) return false;

  const elements = document.body.querySelectorAll<HTMLElement>('body *');
  const limit = Math.min(elements.length, MAX_ELEMENTS_TO_CHECK);

  for (let i = 0; i < limit; i++) {
    const el = elements[i];
    if (el === self) continue;

    const style = getComputedStyle(el);
    if (style.position !== 'fixed') continue;

    const r = el.getBoundingClientRect();
    if (r.bottom <= 0 || r.top >= rect.bottom) continue;

    const overlapW = Math.min(rect.right, r.right) - Math.max(rect.left, r.left);
    const overlapH = Math.min(rect.bottom, r.bottom) - Math.max(rect.top, r.top);
    if (overlapW <= 0 || overlapH <= 0) continue;

    if ((overlapW * overlapH) / selfArea > threshold) {
      return true;
    }
  }

  return false;
}

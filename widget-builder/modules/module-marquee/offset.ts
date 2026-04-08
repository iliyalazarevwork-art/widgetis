export function setPageOffset(px: number): void {
  document.documentElement.style.setProperty('--marquee-offset', `${px}px`);
  document.body.style.paddingTop = `var(--marquee-offset, 0px)`;
}

export function setHeaderOffset(px: number): void {
  const header = document.querySelector<HTMLElement>('.header');
  if (header) header.style.top = `${px}px`;
}

export function clearPageOffset(): void {
  document.documentElement.style.removeProperty('--marquee-offset');
  document.body.style.removeProperty('padding-top');
  clearHeaderOffset();
}

function clearHeaderOffset(): void {
  const header = document.querySelector<HTMLElement>('.header');
  if (header) header.style.removeProperty('top');
}

const STYLE_ID = 'delivery-date-styles';

export function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = buildCSS();
  document.head.appendChild(style);
}

function buildCSS(): string {
  return `
.dd-badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #1a1a1a;
  padding: 10px 14px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  font-weight: 600;
  margin: 10px 0;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
}
.dd-badge__icon {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dd-badge__icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 4px;
}
.dd-badge__text {
  line-height: 1.4;
}
.dd-badge__date {
  font-weight: 700;
  font-size: 15px;
  color: #16a34a;
}
`;
}

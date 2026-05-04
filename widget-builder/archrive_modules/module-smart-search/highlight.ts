export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function highlight(text: string, query: string): string {
  const escaped = escapeHtml(text);
  const tokens = [...new Set(query.trim().split(/\s+/).filter((t) => t.length >= 2))];
  if (tokens.length === 0) return escaped;

  const pattern = tokens.map(escapeRegex).join('|');
  const re = new RegExp(`(${pattern})`, 'gi');

  return escaped.replace(re, '<span class="ssrch-hl">$1</span>');
}

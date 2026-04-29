// HTML-escape user/backend-controlled strings before interpolating into
// dangerouslySetInnerHTML / .innerHTML. Use this anywhere a non-React HTML
// builder needs to embed external data (Leaflet popups, exports, etc).
const ENTITY: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;',
  '/': '&#47;',
};

export function escapeHtml(input: unknown): string {
  if (input === null || input === undefined) return '';
  return String(input).replace(/[&<>"'`/]/g, (c) => ENTITY[c] ?? c);
}

// Inside CSS contexts (e.g. style="background:${color}") plain HTML escaping
// is not enough — `expression()`, comments, or quote-breaking can still inject
// CSS. Restrict to a strict whitelist of color forms.
const SAFE_COLOR = /^(#[0-9a-fA-F]{3,8}|rgb\([\d\s,.%]+\)|rgba\([\d\s,.%]+\)|hsl\([\d\s,.%]+\)|hsla\([\d\s,.%]+\)|[a-zA-Z]+)$/;

export function safeColor(input: unknown, fallback: string): string {
  if (typeof input !== 'string') return fallback;
  return SAFE_COLOR.test(input.trim()) ? input.trim() : fallback;
}

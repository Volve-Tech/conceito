const STRIP_TAGS = /<[^>]+>/g;

/**
 * True when a tag is allowed title markup. Avoids a global RegExp `.test()`
 * so `lastIndex` cannot drop the closing `</b>` / `</span>`.
 */
function isAllowedTitleTag(tag: string): boolean {
  return /^<\/?(?:br|strong|em|b|i|span)(\s[^>]*)?\/?>$/i.test(tag);
}

/**
 * Allow a small set of title markup from the CMS snapshot, strip everything else.
 */
export function sanitizeTitleHtml(input?: string | null): string {
  if (!input) return '';
  return input.replace(STRIP_TAGS, (tag) => (isAllowedTitleTag(tag) ? tag : ''));
}

/**
 * Keep the last two words of a headline together, matching the Next helper.
 */
export function optimizeLineBreak(str: string): string {
  const tokens = str.split(' ');
  if (tokens.length < 3) return str;
  const lastToken = tokens.pop();
  return `${tokens.join(' ')}\u00A0${lastToken}`;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * First non-empty candidate for an img alt. Always returns a string so Astro
 * emits `alt="..."` instead of collapsing an empty value to a boolean attribute.
 */
export function imageAlt(...candidates: Array<string | null | undefined>): string {
  for (const candidate of candidates) {
    const value = candidate?.trim();
    if (value) return value;
  }
  return 'Image';
}

import { DEFAULT_LOCALE, type Locale } from './theme';

/**
 * Prefix a site-root path with Astro `base` (GitHub project Pages uses `/conceito/`).
 * External URLs, hashes, and schemes are left unchanged. Canonicals must not use this.
 */
export function publicHref(path?: string | null): string {
  if (path == null || path === '') {
    return import.meta.env.BASE_URL || '/';
  }
  if (/^(https?:|mailto:|tel:|\/\/|#)/i.test(path)) {
    return path;
  }

  const base = import.meta.env.BASE_URL || '/';
  const prefix = base.endsWith('/') ? base : `${base}/`;
  if (path === '/') {
    return prefix;
  }

  const trimmed = path.startsWith('/') ? path.slice(1) : path;
  if (prefix !== '/' && path.startsWith(prefix)) {
    return path;
  }
  return `${prefix}${trimmed}`;
}

/**
 * Locale path without Astro `base`. Home never appears as `/home`.
 */
function logicalPagePath(slug?: string | null, locale: string = DEFAULT_LOCALE): string {
  const isDefault = locale === DEFAULT_LOCALE;
  const prefix = isDefault ? '' : `/${locale}`;

  if (!slug || slug === 'home') {
    return prefix || '/';
  }

  return `${prefix}/${slug}`;
}

/**
 * Map a Contentful page slug to a public path for the given locale.
 * The home slug never appears in the URL. Includes Astro `base` for in-app links.
 */
export function resolvePageHref(slug?: string | null, locale: string = DEFAULT_LOCALE): string {
  return publicHref(logicalPagePath(slug, locale));
}

/**
 * Locale-aware URL for sitemap / canonical tags (never includes Astro `base`).
 */
export function resolveAbsoluteHref(
  slug: string | null | undefined,
  locale: string,
  site: string,
): string {
  const path = logicalPagePath(slug, locale);
  return new URL(path, site.endsWith('/') ? site : `${site}/`).toString();
}

export function isSupportedLocale(value: string): value is Locale {
  return value === 'en-US' || value === 'de-DE';
}

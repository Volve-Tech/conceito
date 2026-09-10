import { DEFAULT_LOCALE, type Locale } from './theme';

/**
 * Map a Contentful page slug to a public path for the given locale.
 * The home slug never appears in the URL.
 */
export function resolvePageHref(slug?: string | null, locale: string = DEFAULT_LOCALE): string {
  const isDefault = locale === DEFAULT_LOCALE;
  const prefix = isDefault ? '' : `/${locale}`;

  if (!slug || slug === 'home') {
    return prefix || '/';
  }

  return `${prefix}/${slug}`;
}

/**
 * Locale-aware URL for sitemap / canonical tags.
 */
export function resolveAbsoluteHref(
  slug: string | null | undefined,
  locale: string,
  site: string,
): string {
  const path = resolvePageHref(slug, locale);
  return new URL(path, site.endsWith('/') ? site : `${site}/`).toString();
}

export function isSupportedLocale(value: string): value is Locale {
  return value === 'en-US' || value === 'de-DE';
}

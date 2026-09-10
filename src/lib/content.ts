import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

import type {
  FooterData,
  NavigationData,
  PageShell,
  SnapshotManifest,
} from './types';

const CONTENT_ROOT = resolve(process.cwd(), 'src/snapshot');

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

/**
 * Load the committed snapshot manifest.
 */
export function getManifest(): SnapshotManifest {
  return readJson(resolve(CONTENT_ROOT, 'manifest.json'));
}

/**
 * Load a page shell for a locale + slug.
 */
export function getPage(locale: string, slug: string): PageShell | null {
  const filePath = resolve(CONTENT_ROOT, 'pages', locale, `${slug}.json`);
  if (!existsSync(filePath)) return null;
  return readJson(filePath);
}

/**
 * Load a normalized Contentful entry from the snapshot.
 */
export function getEntry<T = Record<string, unknown>>(
  locale: string,
  typename: string,
  id: string,
): T | null {
  const filePath = resolve(CONTENT_ROOT, 'entries', locale, typename, `${id}.json`);
  if (!existsSync(filePath)) return null;
  return readJson(filePath);
}

export function getNavigation(locale: string): NavigationData {
  return readJson(resolve(CONTENT_ROOT, 'globals', locale, 'navigation.json'));
}

export function getFooter(locale: string): FooterData {
  return readJson(resolve(CONTENT_ROOT, 'globals', locale, 'footer.json'));
}

export function getStrings(locale: string): Record<string, Record<string, string>> {
  const filePath = resolve(process.cwd(), 'public/locales', locale, 'common.json');
  return readJson(filePath);
}

export function notNull<T>(value: T | null | undefined): value is T {
  return value != null;
}

export function t(
  strings: Record<string, Record<string, string>>,
  path: string,
  vars: Record<string, string | number> = {},
): string {
  const [ns, key] = path.split('.');
  let value = strings[ns]?.[key] ?? path;
  for (const [name, replacement] of Object.entries(vars)) {
    value = value.replaceAll(`{{ ${name} }}`, String(replacement)).replaceAll(`{{${name}}}`, String(replacement));
  }
  return value;
}

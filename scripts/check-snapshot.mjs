import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_LOCALE = 'en-US';
const CTF_HOST = /(^|\.)ctfassets\.net$/i;

function walkFiles(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walkFiles(full, acc);
    else acc.push(full);
  }
  return acc;
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function resolvePagePath(slug, locale) {
  const prefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`;
  if (!slug || slug === 'home') return prefix || '/';
  return `${prefix}/${slug}`;
}

function collectGraph(value, refs, assetUrls, pageTargets) {
  if (value == null) return;
  if (Array.isArray(value)) {
    for (const item of value) collectGraph(item, refs, assetUrls, pageTargets);
    return;
  }
  if (typeof value !== 'object') return;

  if (value.__typename && value.sys?.id && value.__typename !== 'Asset') {
    refs.push({ __typename: value.__typename, id: value.sys.id });
  }
  if (value.__typename === 'Page' && value.slug) {
    pageTargets.push(value.slug);
  }
  if (typeof value.url === 'string') assetUrls.push(value.url);
  if (typeof value.localPath === 'string') assetUrls.push(value.localPath);

  if (value.json && value.links) {
    for (const entry of [
      ...(value.links.entries?.block || []),
      ...(value.links.entries?.hyperlink || []),
      ...(value.links.entries?.inline || []),
    ]) {
      if (entry?.sys?.id && entry.__typename) {
        refs.push({ __typename: entry.__typename, id: entry.sys.id });
      }
    }
  }

  for (const nested of Object.values(value)) {
    if (nested && typeof nested === 'object') collectGraph(nested, refs, assetUrls, pageTargets);
  }
}

/**
 * Validate a snapshot directory before it is committed.
 * @param {string} root
 */
export function validateSnapshot(root) {
  const errors = [];
  const contentRoot = join(root, 'src/snapshot');
  const manifestPath = join(contentRoot, 'manifest.json');
  if (!existsSync(manifestPath)) {
    return { ok: false, errors: ['manifest.json is missing'] };
  }

  const manifest = readJson(manifestPath);
  const entryFiles = walkFiles(join(contentRoot, 'entries'));
  const pageFiles = walkFiles(join(contentRoot, 'pages'));
  const keys = new Set();

  for (const file of entryFiles) {
    const rel = relative(join(contentRoot, 'entries'), file);
    if (keys.has(rel)) errors.push(`Duplicate entry file ${rel}`);
    keys.add(rel);
  }

  const pagePaths = new Set();
  const pageKeys = new Set();
  for (const page of manifest.pages || []) {
    const key = `${page.locale}/${page.slug}`;
    if (pageKeys.has(key)) errors.push(`Duplicate page ${key}`);
    pageKeys.add(key);
    if (pagePaths.has(page.path)) errors.push(`Duplicate output path ${page.path}`);
    pagePaths.add(page.path);
    if (page.path.includes('/home') || page.path.startsWith('/en-US/')) {
      errors.push(`Invalid public path ${page.path}`);
    }
    const pageFile = join(contentRoot, 'pages', page.locale, `${page.slug}.json`);
    if (!existsSync(pageFile)) errors.push(`Missing page file for ${key}`);
  }

  for (const file of pageFiles) {
    const page = readJson(file);
    const locale = relative(join(contentRoot, 'pages'), file).split('/')[0];
    const refs = [];
    const urls = [];
    const targets = [];
    collectGraph(page, refs, urls, targets);
    for (const ref of [...page.topSection, page.pageContent, ...page.extraSection].filter(Boolean)) {
      const entryPath = join(contentRoot, 'entries', locale, ref.__typename, `${ref.sys.id}.json`);
      if (!existsSync(entryPath)) {
        errors.push(`Unresolved page zone ${ref.__typename}:${ref.sys.id} (${locale})`);
      }
    }
  }

  for (const file of entryFiles) {
    const locale = relative(join(contentRoot, 'entries'), file).split('/')[0];
    const entry = readJson(file);
    const refs = [];
    const urls = [];
    collectGraph(entry, refs, urls, []);
    for (const ref of refs) {
      if (ref.id === entry.sys?.id) continue;
      const entryPath = join(contentRoot, 'entries', locale, ref.__typename, `${ref.id}.json`);
      const pagePath = join(contentRoot, 'pages', locale, `${ref.id}.json`);
      const isPage = ref.__typename === 'Page';
      if (isPage) {
        const pageExists = pageFiles.some((candidate) => {
          const data = readJson(candidate);
          return data.sys?.id === ref.id;
        });
        if (!pageExists && !existsSync(entryPath) && !existsSync(pagePath)) {
          errors.push(`Unresolved page target ${ref.id} from ${relative(contentRoot, file)}`);
        }
        continue;
      }
      if (!existsSync(entryPath)) {
        errors.push(`Unresolved reference ${ref.__typename}:${ref.id} from ${relative(contentRoot, file)}`);
      }
    }
    for (const url of urls) {
      if (typeof url === 'string' && (url.startsWith('https://') || url.startsWith('http://'))) {
        try {
          if (CTF_HOST.test(new URL(url).hostname)) {
            errors.push(`Unlocalized Contentful URL in ${relative(contentRoot, file)}: ${url}`);
          }
        } catch {
          errors.push(`Invalid URL in ${relative(contentRoot, file)}: ${url}`);
        }
      }
    }
  }

  for (const page of manifest.pages || []) {
    const expected = resolvePagePath(page.slug, page.locale);
    if (page.path !== expected) {
      errors.push(`Manifest path ${page.path} does not match ${expected}`);
    }
  }

  return { ok: errors.length === 0, errors };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const report = validateSnapshot(root);
  if (!report.ok) {
    console.error(report.errors.join('\n'));
    process.exit(1);
  }
  console.log('Snapshot is valid');
}

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_LOCALE = 'en-US';

function walkFiles(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walkFiles(full, acc);
    else acc.push(full);
  }
  return acc;
}

const PAGES_BASE = '/conceito';

/**
 * Strip the GitHub project Pages prefix so link checks stay base-agnostic.
 */
function stripBase(href) {
  if (href === PAGES_BASE || href === `${PAGES_BASE}/`) return '/';
  if (href.startsWith(`${PAGES_BASE}/`)) return href.slice(PAGES_BASE.length);
  return href;
}

function pathExists(dist, href) {
  const clean = stripBase(href.split('#')[0].split('?')[0]);
  if (!clean || clean === '/') return existsSync(join(dist, 'index.html'));
  const relativePath = clean.replace(/^\//, '');
  return (
    existsSync(join(dist, relativePath, 'index.html')) ||
    existsSync(join(dist, `${relativePath}.html`))
  );
}

/**
 * Crawl generated HTML for URL, SEO, and accessibility regressions.
 * @param {string} root
 */
export function validateHtml(root) {
  const dist = join(root, 'dist');
  const errors = [];
  const files = walkFiles(dist).filter((file) => file.endsWith('.html'));
  if (files.length === 0) {
    return { ok: false, errors: ['dist/ has no HTML files; run astro build first'] };
  }

  const titles = new Map();

  for (const file of files) {
    const html = readFileSync(file, 'utf8');
    const rel = relative(dist, file);
    const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
    titles.set(title, (titles.get(title) || []).concat(rel));

    if (!html.includes('rel="canonical"')) errors.push(`${rel}: missing canonical`);
    if (!html.includes('name="robots"')) errors.push(`${rel}: missing robots`);
    if (!html.includes('property="og:title"')) errors.push(`${rel}: missing og:title`);
    if (!html.includes('property="og:url"')) errors.push(`${rel}: missing og:url`);
    if (!html.includes('property="og:locale"')) errors.push(`${rel}: missing og:locale`);

    for (const match of html.matchAll(/href="([^"]+)"/g)) {
      const href = match[1];
      const logical = stripBase(href);
      if (logical === '/home' || logical.startsWith('/home/')) {
        errors.push(`${rel}: generated /home link ${href}`);
      }
      if (logical === '/en-US' || logical.startsWith('/en-US/')) {
        errors.push(`${rel}: generated /en-US link ${href}`);
      }
      if (
        href.startsWith('/') &&
        !href.startsWith('//') &&
        !logical.startsWith('/assets') &&
        !logical.startsWith('/_astro') &&
        !logical.startsWith('/scripts') &&
        !logical.startsWith('/locales') &&
        !logical.startsWith('/favicon') &&
        href !== '#'
      ) {
        if (!pathExists(dist, href)) {
          errors.push(`${rel}: broken internal link ${href}`);
        }
      }
    }

    for (const match of html.matchAll(/<img\b([^>]*)>/g)) {
      if (!/\balt(?:="[^"]*")?/.test(match[1])) {
        errors.push(`${rel}: img missing alt (${match[0].slice(0, 120)})`);
      }
    }
  }

  const robots = join(dist, 'robots.txt');
  if (!existsSync(robots)) {
    errors.push('robots.txt is missing');
  } else {
    const body = readFileSync(robots, 'utf8');
    if (body.includes('Disallow: /') && !body.includes('INDEXING_POLICY=disallow')) {
      errors.push('robots.txt copies the Next template Disallow: / without an explicit policy');
    }
  }

  if (!existsSync(join(dist, 'sitemap-index.xml')) && !existsSync(join(dist, 'sitemap.xml'))) {
    errors.push('sitemap is missing');
  }

  return { ok: errors.length === 0, errors, htmlFiles: files.length, defaultLocale: DEFAULT_LOCALE };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const report = validateHtml(root);
  if (!report.ok) {
    console.error(report.errors.join('\n'));
    process.exit(1);
  }
  console.log(`HTML crawl passed (${report.htmlFiles} pages)`);
}

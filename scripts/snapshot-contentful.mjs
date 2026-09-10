import { mkdirSync, writeFileSync, rmSync, cpSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadEnv } from './lib/env.mjs';
import {
  PAGES_QUERY,
  NAV_QUERY,
  FOOTER_QUERY,
  GENERIC_ENTRY_QUERY,
  buildEntryQuery,
} from './lib/graphql.mjs';
import { validateSnapshot } from './check-snapshot.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const NEXT_ROOT = resolve(ROOT, '../template-marketing-webapp-nextjs');
const LOCALES = ['en-US', 'de-DE'];
const PAGE_LIMIT = 50;
const HOME_SLUG = 'home';
const DEFAULT_LOCALE = 'en-US';

const CTF_HOST = /(^|\.)ctfassets\.net$/i;
const KNOWN_UNSUPPORTED_LINK_TYPES = new Set(['category', 'post']);

/**
 * POST a GraphQL operation to Contentful.
 * @param {string} endpoint
 * @param {string} token
 * @param {string} query
 * @param {Record<string, unknown>} variables
 */
async function graphql(endpoint, token, query, variables) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) {
    const message = json.errors?.map((e) => e.message).join('; ') || res.statusText;
    throw new Error(`Contentful GraphQL error: ${message}`);
  }
  return json.data;
}

function visitKey(locale, id) {
  return `${locale}:${id}`;
}

function resolvePagePath(slug, locale) {
  const prefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`;
  if (!slug || slug === HOME_SLUG) return prefix || '/';
  return `${prefix}/${slug}`;
}

function collectRefs(value, refs, assets) {
  if (value == null) return;
  if (Array.isArray(value)) {
    for (const item of value) collectRefs(item, refs, assets);
    return;
  }
  if (typeof value !== 'object') return;

  if (value.__typename === 'Asset' && value.sys?.id) {
    assets.set(value.sys.id, value);
  }

  if (value.__typename && value.sys?.id && value.__typename !== 'Asset') {
    refs.push({ __typename: value.__typename, id: value.sys.id });
  }

  if (value.json && value.links) {
    const entries = [
      ...(value.links.entries?.block || []),
      ...(value.links.entries?.hyperlink || []),
      ...(value.links.entries?.inline || []),
    ];
    for (const entry of entries) {
      if (entry?.sys?.id && entry.__typename) {
        refs.push({ __typename: entry.__typename, id: entry.sys.id });
      }
    }
    const assetList = [
      ...(value.links.assets?.block || []),
      ...(value.links.assets?.hyperlink || []),
    ];
    for (const asset of assetList) {
      if (asset?.sys?.id) assets.set(asset.sys.id, asset);
    }
  }

  for (const nested of Object.values(value)) {
    if (nested && typeof nested === 'object') collectRefs(nested, refs, assets);
  }
}

function rewriteAssets(value, assetMap) {
  if (value == null) return value;
  if (Array.isArray(value)) return value.map((item) => rewriteAssets(item, assetMap));
  if (typeof value !== 'object') return value;

  if (value.__typename === 'Asset' && value.sys?.id && assetMap.has(value.sys.id)) {
    const local = assetMap.get(value.sys.id);
    return { ...value, url: local.publicPath, localPath: local.publicPath };
  }

  const out = {};
  for (const [key, nested] of Object.entries(value)) {
    out[key] = rewriteAssets(nested, assetMap);
  }
  return out;
}

function writeJson(filePath, data) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function isCtfUrl(url) {
  try {
    return CTF_HOST.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

function safeFileName(name) {
  return String(name || 'asset')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

/**
 * Snapshot Contentful into a validated local content graph.
 */
async function main() {
  const env = loadEnv(ROOT);
  if (!env.spaceId || !env.accessToken) {
    throw new Error('CONTENTFUL_SPACE_ID and CONTENTFUL_ACCESS_TOKEN are required');
  }

  const endpoint = `https://graphql.contentful.com/content/v1/spaces/${env.spaceId}`;
  const tmp = resolve(ROOT, '.snapshot-tmp');
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(join(tmp, 'public/assets'), { recursive: true });
  mkdirSync(join(tmp, 'src/snapshot'), { recursive: true });

  const pages = [];
  const entries = new Map();
  const assets = new Map();
  const externalUrls = new Set();
  const warnings = [];

  for (const locale of LOCALES) {
    let skip = 0;
    let total = Infinity;
    while (skip < total) {
      const data = await graphql(endpoint, env.accessToken, PAGES_QUERY, {
        locale,
        limit: PAGE_LIMIT,
        skip,
      });
      const collection = data.pageCollection;
      total = collection.total;
      for (const page of collection.items.filter(Boolean)) {
        if (!page.slug) {
          warnings.push(`Page ${page.sys.id} (${locale}) has no slug and was skipped`);
          continue;
        }
        const shell = {
          __typename: 'Page',
          sys: page.sys,
          pageName: page.pageName,
          slug: page.slug,
          seo: page.seo,
          topSection: (page.topSectionCollection?.items || []).filter(Boolean),
          pageContent: page.pageContent || null,
          extraSection: (page.extraSectionCollection?.items || []).filter(Boolean),
        };
        pages.push({ locale, shell });
        collectRefs(page, [], assets);
      }
      skip += PAGE_LIMIT;
    }

    const nav = await graphql(endpoint, env.accessToken, NAV_QUERY, { locale });
    const footer = await graphql(endpoint, env.accessToken, FOOTER_QUERY, { locale });
    writeJson(join(tmp, `src/snapshot/globals/${locale}/navigation.json`), nav.navigationMenuCollection);
    writeJson(join(tmp, `src/snapshot/globals/${locale}/footer.json`), footer.footerMenuCollection);
    collectRefs(nav, [], assets);
    collectRefs(footer, [], assets);

    const navItems = nav.navigationMenuCollection?.items?.[0]?.menuItemsCollection?.items || [];
    for (const item of navItems) {
      const children = item?.children?.items || [];
      for (const child of children) {
        if (child?.categoryName) {
          warnings.push(`Unsupported category link in navigation: ${child.categoryName}`);
          if (KNOWN_UNSUPPORTED_LINK_TYPES.has('category') && !child.slug) {
            throw new Error('Navigation category link is missing a static route');
          }
        }
        if (child?.postName) {
          warnings.push(`Unsupported post link in navigation: ${child.postName}`);
        }
      }
    }
  }

  const queue = [];
  for (const { locale, shell } of pages) {
    for (const ref of [...shell.topSection, shell.pageContent, ...shell.extraSection]) {
      if (ref?.sys?.id && ref.__typename) queue.push({ locale, __typename: ref.__typename, id: ref.sys.id });
    }
  }

  const visited = new Set();
  while (queue.length) {
    const next = queue.shift();
    const key = visitKey(next.locale, next.id);
    if (visited.has(key)) continue;
    visited.add(key);

    let entry = null;
    const typedQuery = buildEntryQuery(next.__typename);
    if (typedQuery) {
      const data = await graphql(endpoint, env.accessToken, typedQuery, {
        id: next.id,
        locale: next.locale,
      });
      entry = Object.values(data)[0];
    } else {
      const data = await graphql(endpoint, env.accessToken, GENERIC_ENTRY_QUERY, {
        id: next.id,
        locale: next.locale,
      });
      entry = data.entryCollection?.items?.[0];
      if (entry?.__typename && entry.__typename !== next.__typename) {
        queue.push({ locale: next.locale, __typename: entry.__typename, id: next.id });
        visited.delete(key);
        continue;
      }
      warnings.push(`No typed snapshot query for ${next.__typename} (${next.id})`);
    }

    if (!entry) {
      throw new Error(`Unresolved entry ${next.__typename}:${next.id} (${next.locale})`);
    }

    entries.set(`${next.locale}/${entry.__typename}/${entry.sys.id}`, { locale: next.locale, entry });

    const childRefs = [];
    collectRefs(entry, childRefs, assets);
    for (const ref of childRefs) {
      if (ref.id === entry.sys.id) continue;
      queue.push({ locale: next.locale, __typename: ref.__typename, id: ref.id });
    }
  }

  for (const [id, asset] of assets) {
    if (!asset.url) continue;
    if (!isCtfUrl(asset.url)) {
      externalUrls.add(asset.url);
      continue;
    }
    const url = new URL(asset.url);
    const ext = safeFileName(asset.fileName || url.pathname.split('/').pop() || `${id}.bin`);
    const fileName = `${id}-${ext}`;
    const dest = join(tmp, 'public/assets', fileName);
    const res = await fetch(asset.url);
    if (!res.ok) throw new Error(`Failed to download asset ${id}: ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, buf);
    assets.set(id, {
      ...asset,
      publicPath: `/assets/${fileName}`,
      fileName,
    });
  }

  const rewrittenEntries = new Map();
  for (const [key, { locale, entry }] of entries) {
    rewrittenEntries.set(key, { locale, entry: rewriteAssets(entry, assets) });
  }

  for (const { locale, shell } of pages) {
    writeJson(
      join(tmp, `src/snapshot/pages/${locale}/${shell.slug}.json`),
      rewriteAssets(shell, assets),
    );
  }
  for (const [key, { entry }] of rewrittenEntries) {
    writeJson(join(tmp, `src/snapshot/entries/${key}.json`), entry);
  }

  const brandDir = join(tmp, 'public/assets/brand');
  mkdirSync(brandDir, { recursive: true });
  const brandSources = [
    join(NEXT_ROOT, 'src/icons/conceito-logo.svg'),
    join(NEXT_ROOT, 'src/assets/images/tick-button.svg'),
    join(NEXT_ROOT, 'src/assets/images/service-item.svg'),
    join(NEXT_ROOT, 'src/assets/images/play.svg'),
    join(NEXT_ROOT, 'src/assets/images/whats.svg'),
    join(NEXT_ROOT, 'src/assets/images/arrow.svg'),
  ];
  for (const file of brandSources) {
    if (existsSync(file)) cpSync(file, join(brandDir, file.split('/').pop()));
  }

  /** Client logos live in-repo so a snapshot wipe of public/assets cannot drop them. */
  const clientLogoSrc = join(ROOT, 'src/assets/brand/clients');
  const clientLogoDest = join(brandDir, 'clients');
  if (existsSync(clientLogoSrc)) {
    mkdirSync(clientLogoDest, { recursive: true });
    cpSync(clientLogoSrc, clientLogoDest, { recursive: true });
  }

  const questorUrl =
    'https://yt3.googleusercontent.com/EzrNgCBc6zStXDNHqvnp5a6LMrtyZWi6BS2sEJiu9lSnSV4PrnZZWModt9LH7JlbF43o-hilfg=s900-c-k-c0x00ffffff-no-rj';
  externalUrls.add(questorUrl);
  externalUrls.add('https://www.facebook.com/conceitocontabilidade.cnt');
  externalUrls.add('https://www.instagram.com/conceitocontabilidade_/');
  externalUrls.add('https://br.linkedin.com/company/conceito-contabilidade');
  externalUrls.add('https://www.youtube.com/@conceito.contabilidade');
  externalUrls.add('https://www.tiktok.com/@conceitocontabilidade');
  externalUrls.add('https://conceitocontabilidade.app.questorpublico.com.br/entrar');

  const manifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    locales: LOCALES,
    pages: pages.map(({ locale, shell }) => ({
      locale,
      slug: shell.slug,
      path: resolvePagePath(shell.slug, locale),
    })),
    entryCount: rewrittenEntries.size,
    assetCount: [...assets.values()].filter((a) => a.publicPath).length,
    externalUrls: [...externalUrls].sort(),
    warnings,
  };
  writeJson(join(tmp, 'src/snapshot/manifest.json'), manifest);

  const report = validateSnapshot(tmp);
  if (!report.ok) {
    throw new Error(`Snapshot validation failed:\n${report.errors.join('\n')}`);
  }

  rmSync(join(ROOT, 'src/snapshot'), { recursive: true, force: true });
  rmSync(join(ROOT, 'public/assets'), { recursive: true, force: true });
  cpSync(join(tmp, 'src/snapshot'), join(ROOT, 'src/snapshot'), { recursive: true });
  cpSync(join(tmp, 'public/assets'), join(ROOT, 'public/assets'), { recursive: true });
  rmSync(tmp, { recursive: true, force: true });

  console.log(
    `Snapshot complete: ${manifest.pages.length} pages, ${manifest.entryCount} entries, ${manifest.assetCount} assets`,
  );
  if (warnings.length) {
    console.warn(`Warnings:\n- ${warnings.join('\n- ')}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

# static-migration — agent instructions

Astro-native static marketing site. Content is a committed Contentful snapshot. There is no CMS at build or runtime after `src/snapshot/` exists.

## Commands

Run from `static-migration/`:

```bash
npm run snapshot        # refresh dump (needs Next .env CONTENTFUL_* vars)
npm run check-snapshot  # snapshot graph integrity
npm run build           # static dist/, no Contentful required
npm run check           # astro check
npm run check-html      # crawl dist/ for /home, /en-US, broken links, SEO, alts
npm run preview         # serve dist/
npm run cf:dev          # serve dist/ with Wrangler (needs a prior build)
npm run deploy          # astro build && wrangler deploy to workers.dev
```

Harness after any content or UI change: `check-snapshot` → `build` → `check` → `check-html` → browser QA on the changed routes.

Preview hosting is Cloudflare Workers static assets (`wrangler.jsonc`). No `@astrojs/cloudflare` adapter. Canonical URLs stay `https://conceitocontabilidade.com.br`. `public/_headers` sends `X-Robots-Tag: noindex` on the workers.dev preview — drop that before a production DNS cutover.

`astro build` must succeed with Contentful env vars unset.

## Routing and links

- Default locale `en-US` is unprefixed: `/`, `/{slug}`.
- `de-DE` is prefixed: `/de-DE/`, `/de-DE/{slug}`.
- Every page/nav/footer/CTA/rich-text link goes through `resolvePageHref(slug, locale)`.
- Slug `home` maps to the locale root. Never emit `/home` or `/en-US/...`.

## Snapshot contract

- Snapshot lives in `src/snapshot/`, **not** `src/content/` (Astro 5 treats `src/content/` as collections).
- Keep Contentful rich-text **JSON**. Do not convert it to Markdown.
- Page files are thin zone-id shells. Entries are `entries/{locale}/{__typename}/{id}.json`.
- GraphQL unions need `... on Entry { __typename sys { id } }` and page links need `... on Page { slug pageName }`.
- Paginate `pageCollection`. Fail on unresolved rich-text/entry/asset IDs.
- The snapshot script wipes `public/assets` then recopies brand files from `public/assets/brand`. Keep brand sources in that copy list.
- External footer/social URLs stay external (listed in `manifest.externalUrls`). Do not treat them as CMS assets.

## UI port rules

- Port Next `ctf-*` presentational files to `.astro`. Do not wrap MUI/Emotion.
- Resolve sections with the GraphQL `__typename` map. Unknown typenames are build errors.
- Only add components for typenames present in the snapshot.
- Theme: `htmlFontSize: 10`, Open Sans, palettes 1–7, `CONTAINER_WIDTH` 1260, header 8rem/9rem.
- Header must overlay the first section: `margin-bottom: -8rem` (Next `MuiAppBar` override).
- `TopicBusinessInfo`: `name` is the small heading (`h2`), `shortDescription` is the large heading (`h1`).
- YouTube: extract the 11-character video id. Do not naively replace `watch?v=` (list query params break `/embed/`).
- Use `imageAlt(...)` for dynamic `alt`. Empty string becomes a boolean `alt` attribute in Astro.
- Client JS is vanilla in `public/scripts/ui.js`, loaded with `is:inline`. No React islands.
- Contact form stays a disabled stub. Document `{ token, name, email, phone, message }`. Do not `fetch('/api/contact')`.
- Do not add a locale switcher (`LanguageSelector` is unused in Next).
- Do not copy `_document.tsx` global `noindex, nofollow` or `robots.txt` `Disallow: /`. Indexing is `INDEXING_POLICY` (`allow` by default).

## Visual QA

Compare against the live Next site (`https://conceitocontabilidade.com.br`) and/or a local Next oracle. Check home, a service slug, `/fale-com-a-gente`, `/sobre-nos`, `/404`, `/de-DE/`, plus mobile menu, header dark-on-scroll, and carousels.

Known snapshot quirks (CMS data, do not "fix" unless asked): duplicate IRPF nav item, Xanxerê `url: #`, leftover template slugs (`pricing`, card pages, `accessibility`), shared `Über das Unternehmen` titles on many `de-DE` leftovers.

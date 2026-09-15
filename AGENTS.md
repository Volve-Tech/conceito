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
npm run contact:dev     # local contact Worker (wrangler)
npm run contact:deploy  # publish conceito-contact Worker
npm run contact:types   # regenerate worker/worker-configuration.d.ts
```

Harness after any content or UI change: `check-snapshot` → `build` → `check` → `check-html` → browser QA on the changed routes.

Production hosting is GitHub Pages (`.github/workflows/deploy.yml`) on the apex `https://conceitocontabilidade.com.br`. Keep `public/.nojekyll` and `public/CNAME` (`conceitocontabilidade.com.br`). Do not set `ASTRO_BASE` in the Pages workflow — CSS, JS, and images must be `/_astro`, `/assets`, and `/scripts`, not `/conceito/...`. All in-app asset `src`/`href` values go through `publicHref`.

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
- Contact form POSTs `{ token, name, email, phone, message }` to the absolute `PUBLIC_CONTACT_API_URL` Worker. Classic reCAPTCHA v3 (`PUBLIC_RECAPTCHA_SITE_KEY`, action `contact`). Do not `fetch('/api/contact')` or route the API through `publicHref`.
- Worker lives in `worker/` (`conceito-contact`): CORS, siteverify, Email Sending binding. Secrets via `wrangler secret put`: `RECAPTCHA_SECRET_KEY`, `CONTACT_EMAIL`, `CONTACT_FROM`. `CONTACT_FROM` must be on a domain enabled with `npx wrangler email sending enable <domain>`. CMS `targetEmail` stays unused.
- If `PUBLIC_CONTACT_API_URL` or `PUBLIC_RECAPTCHA_SITE_KEY` is unset at build time, the form stays a disabled stub with the Portuguese backend notice.
- Do not add a locale switcher (`LanguageSelector` is unused in Next).
- Do not copy `_document.tsx` global `noindex, nofollow` or `robots.txt` `Disallow: /`. Indexing is `INDEXING_POLICY` (`allow` by default).

## Visual QA

Compare against the live Next site (`https://conceitocontabilidade.com.br`) and/or a local Next oracle. Check home, a service slug, `/fale-com-a-gente`, `/sobre-nos`, `/404`, `/de-DE/`, plus mobile menu, header dark-on-scroll, and carousels. On `/fale-com-a-gente`, submit uses the Worker URL (never `/api/contact`).

Known snapshot quirks (CMS data, do not "fix" unless asked): duplicate IRPF nav item, Xanxerê `url: #`, leftover template slugs (`pricing`, card pages, `accessibility`), shared `Über das Unternehmen` titles on many `de-DE` leftovers.

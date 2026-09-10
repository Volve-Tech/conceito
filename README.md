# Conceito — static marketing site

Astro rebuild of the former Next.js + Contentful marketing site. Runtime pages
are generated from a committed Contentful snapshot; the CMS is not contacted
during `astro build` or in the browser.

## Commands

```bash
npm install
npm run snapshot        # dump Contentful → src/content + public/assets
npm run check-snapshot  # validate the committed snapshot
npm run dev
npm run build
npm run preview
```

`snapshot` reads `CONTENTFUL_SPACE_ID` and `CONTENTFUL_ACCESS_TOKEN` from
`.env` or from `../template-marketing-webapp-nextjs/.env`.

## URL scheme

- Default locale `en-US`: `/`, `/{slug}`
- `de-DE`: `/de-DE/`, `/de-DE/{slug}`
- Home slug `home` always maps to the locale root

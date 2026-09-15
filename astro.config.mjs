import { defineConfig } from 'astro/config';

const site = process.env.SITE_URL || 'https://conceitocontabilidade.com.br';
const base = process.env.ASTRO_BASE || '/';

/**
 * Astro config for the Conceito static marketing site.
 * Default locale is unprefixed so public URLs stay `/` and `/{slug}`.
 * Apex GitHub Pages uses `base: /`. Set `ASTRO_BASE` only for a project-Pages preview.
 */
export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  i18n: {
    defaultLocale: 'en-US',
    locales: ['en-US', 'de-DE'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});

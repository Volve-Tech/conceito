import { defineConfig } from 'astro/config';

const site = process.env.SITE_URL || 'https://conceitocontabilidade.com.br';
const base = process.env.ASTRO_BASE || '/';

/**
 * Astro config for the Conceito static marketing site.
 * Default locale is unprefixed so public URLs stay `/` and `/{slug}`.
 * GitHub project Pages sets `ASTRO_BASE=/conceito/` so `/_astro` and `/assets` resolve.
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

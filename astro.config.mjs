import { defineConfig } from 'astro/config';

const site = process.env.SITE_URL || 'https://conceitocontabilidade.com.br';

/**
 * Astro config for the Conceito static marketing site.
 * Default locale is unprefixed so public URLs stay `/` and `/{slug}`.
 */
export default defineConfig({
  site,
  trailingSlash: 'ignore',
  i18n: {
    defaultLocale: 'en-US',
    locales: ['en-US', 'de-DE'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});

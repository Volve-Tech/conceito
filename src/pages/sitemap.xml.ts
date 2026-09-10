import type { APIRoute } from 'astro';

import { getManifest } from '../lib/content';

/**
 * Sitemap generated from the validated snapshot manifest.
 */
export const GET: APIRoute = ({ site }) => {
  const origin = (site ?? new URL('https://conceitocontabilidade.com.br')).toString().replace(/\/$/, '');
  const urls = getManifest()
    .pages.map((page) => `  <url><loc>${origin}${page.path === '/' ? '/' : page.path}</loc></url>`)
    .join('\n');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};

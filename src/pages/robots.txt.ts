import type { APIRoute } from 'astro';

const policy = import.meta.env.INDEXING_POLICY || 'allow';

/**
 * Production robots.txt. The Next template's global Disallow is not copied.
 */
export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL('sitemap.xml', site ?? 'https://conceitocontabilidade.com.br').toString();
  const allow = policy === 'disallow' ? 'Disallow: /' : 'Allow: /';
  const body = `# INDEXING_POLICY=${policy}
User-agent: *
${allow}

Sitemap: ${sitemap}
`;
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};

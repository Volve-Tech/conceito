const DEFAULT_ALLOWED_ORIGINS = [
  'https://volve-tech.github.io',
  'https://conceitocontabilidade.com.br',
];

/**
 * Parse the comma-separated ALLOWED_ORIGINS Worker var.
 *
 * @param raw - Env string, or empty to use the production defaults
 */
export function parseAllowedOrigins(raw?: string): string[] {
  const origins = (raw ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return origins.length > 0 ? origins : DEFAULT_ALLOWED_ORIGINS;
}

/**
 * CORS headers that echo a request origin only when it is allow-listed.
 *
 * @param requestOrigin - The incoming `Origin` header
 * @param allowed - Allow-listed origins
 */
export function corsHeaders(requestOrigin: string | null, allowed: string[]): HeadersInit {
  const allowOrigin = requestOrigin && allowed.includes(requestOrigin) ? requestOrigin : null;
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (allowOrigin) {
    headers['Access-Control-Allow-Origin'] = allowOrigin;
  }
  return headers;
}

/**
 * Whether the request `Origin` is allowed to call this Worker.
 * Same-origin or missing Origin (curl / server-to-server) is rejected so
 * only the marketing site can POST.
 *
 * @param requestOrigin - The incoming `Origin` header
 * @param allowed - Allow-listed origins
 */
export function isAllowedOrigin(requestOrigin: string | null, allowed: string[]): boolean {
  return Boolean(requestOrigin && allowed.includes(requestOrigin));
}

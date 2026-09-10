import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Parse a dotenv file into a key/value map.
 * @param {string} filePath
 * @returns {Record<string, string>}
 */
export function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const out = {};
  for (const rawLine of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

/**
 * Load Contentful + site env from the static project, then the Next app.
 * @param {string} projectRoot
 */
export function loadEnv(projectRoot) {
  const files = [
    resolve(projectRoot, '.env'),
    resolve(projectRoot, '../template-marketing-webapp-nextjs/.env'),
  ];
  const merged = {};
  for (const file of files) {
    Object.assign(merged, parseEnvFile(file));
  }
  for (const [key, value] of Object.entries(merged)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }
  return {
    spaceId: process.env.CONTENTFUL_SPACE_ID,
    accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
    siteUrl: process.env.SITE_URL || 'https://conceitocontabilidade.com.br',
    indexingPolicy: process.env.INDEXING_POLICY || 'allow',
  };
}

const EMAIL_PATTERN = /\S+@\S+\.\S+/;
const LIMITS = {
  name: 200,
  email: 254,
  phone: 40,
  message: 5000,
} as const;

export interface ContactPayload {
  token: string;
  name: string;
  email: string;
  phone: string;
  message: string;
}

/**
 * Narrow unknown JSON to the Next-oracle contact contract.
 *
 * @param body - Parsed JSON
 */
export function parseContactPayload(body: unknown): ContactPayload | null {
  if (body == null || typeof body !== 'object') {
    return null;
  }

  const record = body as Record<string, unknown>;
  const token = asTrimmedString(record.token);
  const name = asTrimmedString(record.name);
  const email = asTrimmedString(record.email);
  const phone = asTrimmedString(record.phone);
  const message = asTrimmedString(record.message);

  if (!token || !name || !email || !phone || !message) {
    return null;
  }
  if (!EMAIL_PATTERN.test(email)) {
    return null;
  }
  if (name.length > LIMITS.name || email.length > LIMITS.email) {
    return null;
  }
  if (phone.length > LIMITS.phone || message.length > LIMITS.message) {
    return null;
  }

  return { token, name, email, phone, message };
}

/**
 * Escape user text before interpolating it into HTML email.
 *
 * @param value - Untrusted field
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function asTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

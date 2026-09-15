const SITEVERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const MIN_SCORE = 0.5;
const EXPECTED_ACTION = 'contact';

interface SiteVerifyResponse {
  success?: boolean;
  score?: number;
  action?: string;
  'error-codes'?: string[];
}

/**
 * Verify a classic reCAPTCHA v3 token (not Enterprise).
 *
 * @param token - Token from `grecaptcha.execute`
 * @param secret - `RECAPTCHA_SECRET_KEY`
 */
export async function verifyRecaptchaToken(token: string, secret: string): Promise<boolean> {
  const body = new URLSearchParams();
  body.set('secret', secret);
  body.set('response', token);

  const response = await fetch(SITEVERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    return false;
  }

  const data = (await response.json()) as SiteVerifyResponse;
  if (!data.success) {
    return false;
  }
  if (typeof data.score === 'number' && data.score < MIN_SCORE) {
    return false;
  }
  if (data.action && data.action !== EXPECTED_ACTION) {
    return false;
  }
  return true;
}

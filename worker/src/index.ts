import { corsHeaders, isAllowedOrigin, parseAllowedOrigins } from './cors';
import { sendContactEmail } from './mail';
import { verifyRecaptchaToken } from './recaptcha';
import { parseContactPayload } from './validate';

const MAX_BODY_BYTES = 16 * 1024;

/**
 * Contact API Worker: CORS, reCAPTCHA v3, Email Sending.
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const allowed = parseAllowedOrigins(env.ALLOWED_ORIGINS);
    const origin = request.headers.get('Origin');
    const headers = corsHeaders(origin, allowed);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    if (request.method !== 'POST') {
      return json({ message: 'Method not allowed' }, 405, headers);
    }

    if (!isAllowedOrigin(origin, allowed)) {
      return json({ message: 'Origin not allowed' }, 403, headers);
    }

    const contentType = request.headers.get('Content-Type') || '';
    if (!contentType.toLowerCase().includes('application/json')) {
      return json({ message: 'Unsupported media type' }, 415, headers);
    }

    const payload = await readPayload(request);
    if (!payload) {
      return json({ message: 'Invalid request body' }, 400, headers);
    }

    const secret = env.RECAPTCHA_SECRET_KEY;
    const to = env.CONTACT_EMAIL;
    const from = env.CONTACT_FROM;
    if (!secret || !to || !from) {
      return json({ message: 'Error sending email' }, 500, headers);
    }

    const captchaOk = await verifyRecaptchaToken(payload.token, secret);
    if (!captchaOk) {
      return json({ message: 'Invalid reCAPTCHA token' }, 400, headers);
    }

    try {
      await sendContactEmail(env.EMAIL, payload, to, from);
      return json({ message: 'Email sent successfully' }, 200, headers);
    } catch (error) {
      console.error('Error sending email:', error);
      return json({ message: 'Error sending email' }, 500, headers);
    }
  },
} satisfies ExportedHandler<Env>;

/**
 * Read and validate a bounded JSON body.
 *
 * @param request - Incoming POST
 */
async function readPayload(request: Request) {
  const declared = Number(request.headers.get('Content-Length') || 0);
  if (declared > MAX_BODY_BYTES) {
    return null;
  }

  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) {
    return null;
  }

  try {
    return parseContactPayload(JSON.parse(text));
  } catch {
    return null;
  }
}

/**
 * JSON response with CORS headers.
 *
 * @param body - Serializable payload
 * @param status - HTTP status
 * @param headers - CORS + vary headers
 */
function json(body: unknown, status: number, headers: HeadersInit): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

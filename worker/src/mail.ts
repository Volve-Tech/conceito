import { escapeHtml, type ContactPayload } from './validate';

/**
 * Deliver the contact message through the Email Sending binding.
 *
 * @param email - Generated `EMAIL` binding
 * @param payload - Validated form fields
 * @param to - Inbox (`CONTACT_EMAIL`)
 * @param from - Onboarded sending address (`CONTACT_FROM`)
 */
export async function sendContactEmail(
  email: SendEmail,
  payload: ContactPayload,
  to: string,
  from: string,
): Promise<void> {
  const safeName = escapeHtml(payload.name);
  const safeEmail = escapeHtml(payload.email);
  const safePhone = escapeHtml(payload.phone);
  const safeMessage = escapeHtml(payload.message).replace(/\n/g, '<br>\n');

  await email.send({
    to,
    from: { email: from, name: 'Conceito' },
    replyTo: payload.email,
    subject: 'Contato do site Conceito',
    text: [
      `Nome: ${payload.name}`,
      `Email: ${payload.email}`,
      `Telefone: ${payload.phone}`,
      `Mensagem: ${payload.message}`,
    ].join('\n'),
    html: [
      `<p>Nome: ${safeName}</p>`,
      `<p>Email: ${safeEmail}</p>`,
      `<p>Telefone: ${safePhone}</p>`,
      `<p>Mensagem: ${safeMessage}</p>`,
    ].join('\n'),
  });
}

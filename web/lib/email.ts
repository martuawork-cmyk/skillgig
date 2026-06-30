// SkillGig.id — transactional email helper (Resend)
//
// Tiny wrapper around the Resend SDK that:
//   - Skips silently when RESEND_API_KEY is not configured (so the
//     subscribe flow works in dev / preview deployments without email).
//   - Always logs the outcome so we can trace failures in server logs.
//   - Returns a discriminated result so the caller (route handler) can
//     decide whether to surface a soft warning to the user.

import 'server-only';

const FROM_ADDRESS =
  process.env.RESEND_FROM_EMAIL ?? 'SkillGig <hello@skillgig.id>';

type SendResult =
  | { sent: true; id: string }
  | { sent: false; skipped: true }
  | { sent: false; skipped: false; error: string };

let _client: import('resend').Resend | null = null;
let _loaded = false;

/**
 * Lazy-load Resend so the module can be imported even when the package
 * isn't installed yet (e.g. during local dev without email). The first
 * successful `send*` call will throw a clear error if `resend` is missing.
 */
async function getClient(): Promise<import('resend').Resend | null> {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_loaded) {
    try {
      const mod = await import('resend');
      _client = new mod.Resend(process.env.RESEND_API_KEY);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[email] failed to load resend SDK:', err);
      _client = null;
    }
    _loaded = true;
  }
  return _client;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Welcome email sent right after a successful subscribe insert.
 *
 * `skillName` may be null when the user opted in via the "email only" path
 * (no skill chosen). We render a generic message in that case instead of
 * fabricating a skill label.
 */
export async function sendWelcomeEmail(
  email: string,
  skillName: string | null,
): Promise<SendResult> {
  const client = await getClient();
  if (!client) {
    // No API key → silently skip. This is the expected behaviour for
    // local dev, preview deploys, and any environment where email isn't
    // configured. The subscribe flow itself still succeeded.
    return { sent: false, skipped: true };
  }

  const safeEmail  = escapeHtml(email);
  const safeSkill  = skillName ? escapeHtml(skillName) : null;
  const skillLine  = safeSkill
    ? `<p style="margin:0 0 16px;font-size:15px;color:#334155;">Kamu akan menerima update mingguan tentang <strong style="color:#0f172a;">${safeSkill}</strong>.</p>`
    : `<p style="margin:0 0 16px;font-size:15px;color:#334155;">Kamu akan menerima update mingguan tentang skill pilihanmu.</p>`;

  const subject = safeSkill
    ? `Selamat datang di newsletter SkillGig — ${safeSkill}`
    : 'Selamat datang di newsletter SkillGig';

  const html = `
<!doctype html>
<html lang="id">
  <body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
            <tr>
              <td style="padding:32px;background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 50%,#c026d3 100%);color:#ffffff;">
                <h1 style="margin:0;font-size:22px;letter-spacing:-0.01em;">📨 Selamat datang di SkillGig</h1>
                <p style="margin:8px 0 0;font-size:14px;color:#e0e7ff;">Newsletter mingguan untuk freelancer Indonesia</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px;">
                <p style="margin:0 0 16px;font-size:15px;color:#334155;">Halo <strong style="color:#0f172a;">${safeEmail}</strong>,</p>
                ${skillLine}
                <p style="margin:0 0 16px;font-size:15px;color:#334155;">Setiap minggu kami kirim:</p>
                <ul style="margin:0 0 16px;padding-left:20px;font-size:15px;color:#334155;">
                  <li>Lowongan freelance pilihan dari klien Indonesia</li>
                  <li>Kursus baru yang relevan dengan skill kamu</li>
                  <li>Tips singkat untuk meningkatkan income</li>
                </ul>
                <p style="margin:0 0 4px;font-size:13px;color:#64748b;">Tanpa spam. Berhenti kapan saja lewat tombol di bawah email.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px;background:#f1f5f9;border-top:1px solid #e2e8f0;text-align:center;">
                <p style="margin:0;font-size:11px;color:#64748b;">© 2026 SkillGig.id · Kamu menerima email ini karena baru saja subscribe di website kami.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();

  try {
    const res = await client.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject,
      html,
    });
    if (res.error) {
      // eslint-disable-next-line no-console
      console.warn('[email] resend returned error:', res.error);
      return { sent: false, skipped: false, error: res.error.message };
    }
    return { sent: true, id: res.data?.id ?? 'unknown' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // eslint-disable-next-line no-console
    console.warn('[email] send failed:', msg);
    return { sent: false, skipped: false, error: msg };
  }
}
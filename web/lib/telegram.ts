import 'server-only';

// =============================================================================
// SkillGig.id — Telegram Bot notification (Task C3 skeleton).
// -----------------------------------------------------------------------------
// Sends a channel/group message via the Telegram Bot API whenever a job listing
// is approved (status → 'published'). Intended for an internal moderation
// channel so the team sees new live listings in real time.
//
// Configuration (server env, never NEXT_PUBLIC_):
//   TELEGRAM_BOT_TOKEN — from @BotFather when you create the bot.
//   TELEGRAM_CHAT_ID   — the target channel/group id (e.g. -1001234567890).
//                        For a public channel, add the bot as admin first.
//
// When either env var is unset the module is a silent no-op: isTelegramConfigured()
// is false and every send returns false without touching the network. This lets
// the approve flow call notifyJobApproved() unconditionally — it only fires when
// actually wired up. All sends are best-effort: a Telegram outage never throws
// back into the caller (the status update must never roll back on a ping fail).
// =============================================================================

import { formatIDR } from './utils';
import { formatSalaryIDRCompact } from './currency';

const TELEGRAM_API_BASE = 'https://api.telegram.org';
const SEND_TIMEOUT_MS = 10_000;

/** Compact payload describing the listing that just went live. */
export interface JobApprovedPayload {
  id: string;
  title: string;
  company?: string | null;
  url?: string | null;
  category?: string | null;
  location?: string | null;
  jobType?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  /** Optional pre-computed auto-tags (lib/tagging) to surface in the message. */
  tags?: string[];
}

/** True only when both required env vars are present. */
export function isTelegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

/** Escape a string for Telegram's HTML parse_mode (& < >). */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Low-level send. Returns true on success, false on any failure (network,
 * non-2xx, misconfiguration). Never throws.
 */
export async function sendTelegramMessage(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;

  try {
    const res = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        // Listings carry the real outbound URL; suppress the link preview card
        // so the message stays compact and attribution stays in our copy.
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
      // Notifications must always hit the live API — never a cached response.
      cache: 'no-store',
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      // eslint-disable-next-line no-console
      console.error('[telegram] sendMessage failed:', res.status, body);
      return false;
    }
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[telegram] sendMessage threw:', err);
    return false;
  }
}

/**
 * Generic channel notification — the bare "send an arbitrary message" entry
 * point requested by the bot skeleton. Thin alias over sendTelegramMessage so
 * ad-hoc callers (e.g. a future admin "ping the channel" action) can send a
 * raw string without constructing a JobApprovedPayload. Same best-effort
 * semantics: returns false when unconfigured or on any failure, never throws.
 */
export const sendTelegramNotification = (message: string): Promise<boolean> =>
  sendTelegramMessage(message);

/** One-line human salary for the message, converting foreign currency to IDR. */
function salaryLine(p: JobApprovedPayload): string {
  const min = p.salaryMin ?? 0;
  const max = p.salaryMax ?? 0;
  if (min === 0 && max === 0) return 'Nego';
  const ccy = (p.salaryCurrency ?? 'IDR').trim().toUpperCase();
  // All synced sources (Remotive, Adzuna) report ANNUAL figures today.
  // Suffix "/thn" so the number isn't mistaken for a monthly salary.
  const period = '/thn';
  if (ccy === 'IDR') {
    const dash = ' – ';
    return `${formatIDR(min)}${dash}${formatIDR(max)}${period}`;
  }
  // Foreign currency: show the converted ≈ IDR range (Task C3 currency util).
  return `≈ ${formatSalaryIDRCompact(min, max, ccy)}${period}`;
}

/**
 * Build the approval message body (HTML). Exported so it can be unit-tested
 * without going to the network.
 */
export function buildJobApprovedMessage(p: JobApprovedPayload): string {
  const title = escapeHtml(p.title || '(tanpa judul)');
  const company = p.company ? ` · ${escapeHtml(p.company)}` : '';
  const lines: string[] = [
    '✅ <b>Lowongan baru di-approve</b>',
    `${title}${company}`,
  ];
  if (p.jobType || p.location) {
    const bits = [p.jobType, p.location]
      .filter((x): x is string => Boolean(x))
      .map(escapeHtml);
    if (bits.length) lines.push(bits.join(' · '));
  }
  lines.push(`💰 Gaji: ${escapeHtml(salaryLine(p))}`);
  if (p.category) lines.push(`🏷 Kategori: ${escapeHtml(p.category)}`);
  if (p.tags && p.tags.length) {
    lines.push(`🔖 ${p.tags.slice(0, 8).map(escapeHtml).join(', ')}`);
  }
  if (p.url) lines.push(`🔗 <a href="${escapeHtml(p.url)}">Lihat lowongan</a>`);
  return lines.join('\n');
}

/**
 * Notify the Telegram channel that a listing was approved. Best-effort: returns
 * true if the message was sent, false otherwise (including when unconfigured).
 * Never throws — safe to `void` from the approve flow.
 *
 * @example
 *   await notifyJobApproved({
 *     id: '...', title: 'Senior React Engineer', company: 'Acme',
 *     url: 'https://...', salaryMin: 60000, salaryMax: 90000,
 *     salaryCurrency: 'USD', tags: ['React.js', 'Asia-friendly'],
 *   });
 */
export async function notifyJobApproved(p: JobApprovedPayload): Promise<boolean> {
  if (!isTelegramConfigured()) return false;
  return sendTelegramMessage(buildJobApprovedMessage(p));
}

// =============================================================================
// Cron sync completion notification.
// -----------------------------------------------------------------------------
// Fired at the end of the job-sync cron (lib/job-sync/cron-handler.ts) when a
// run added at least one new gig. Gives the admin/moderation team a heads-up
// that fresh listings just landed — same channel, same best-effort semantics as
// the approval ping: a silent no-op when unconfigured, and it never throws back
// into the cron (a Telegram outage must never turn a successful sync into a
// failed cron response).
// =============================================================================

/**
 * Per-source counts surfaced in the cron-completion message. Structurally
 * compatible with cron-handler's SourceStats — extra fields there (e.g.
 * `skipped`) are harmless, we only read added/updated/error.
 */
export interface SyncSourceStats {
  added: number;
  updated: number;
  /** Set only when the whole source fatally threw this run. */
  error?: string;
}

/** Payload for notifyNewGigsSynced() — per-source stats keyed by source name
 *  (remotive / jobicy / remoteok / …). Generic so new sources need no change
 *  here: the message builder just iterates whatever keys it's given. */
export type GigsSyncedPayload = Record<string, SyncSourceStats | undefined>;

/** Pretty label for a source key; falls back to capitalising the key. */
const SOURCE_LABELS: Record<string, string> = {
  remotive: 'Remotive',
  jobicy: 'Jobicy',
  remoteok: 'RemoteOK',
};
function sourceLabel(key: string): string {
  return SOURCE_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

/**
 * Format a Date as a readable WIB (Asia/Jakarta, UTC+7) stamp, e.g.
 * "3 Jul 2026, 14.30 WIB". Cron timestamps are UTC otherwise; surfacing WIB
 * keeps the message scannable for an Indonesia-based admin.
 */
function formatWIB(date: Date): string {
  return (
    new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date) + ' WIB'
  );
}

/**
 * One source line for the sync message, or null when that source didn't run.
 * A fatally-errored source shows ⚠️ instead of counts.
 */
function syncSourceLine(name: string, stats: SyncSourceStats | undefined): string | null {
  if (!stats) return null;
  if (stats.error) return `${name}: ⚠️ gagal`;
  return `${name}: +${stats.added} baru, ${stats.updated} update`;
}

/**
 * Build the cron-sync message body (HTML). Exported so it can be unit-tested
 * without going to the network. Iterates whatever source keys the payload
 * carries, so adding a job source needs no change here.
 */
export function buildNewGigsSyncedMessage(stats: GigsSyncedPayload): string {
  const entries = Object.entries(stats).filter(
    (e): e is [string, SyncSourceStats] => Boolean(e[1]),
  );
  const totalAdded = entries.reduce((sum, [, s]) => sum + (s.added ?? 0), 0);
  const lines: string[] = [`🆕 <b>Sync selesai</b> — ${formatWIB(new Date())}`];
  for (const [key, s] of entries) {
    const line = syncSourceLine(sourceLabel(key), s);
    if (line) lines.push(line);
  }
  lines.push(`Total: ${totalAdded} gig baru masuk`);
  return lines.join('\n');
}

/**
 * Notify the Telegram channel that a cron sync just landed new gigs. Best-effort
 * fire-and-forget: returns true if sent, false otherwise (including when
 * unconfigured). Never throws — safe to `void` from the cron handler.
 *
 * Callers should gate on `totalAdded > 0` so the channel isn't spammed on runs
 * that added nothing.
 */
export async function notifyNewGigsSynced(stats: GigsSyncedPayload): Promise<boolean> {
  if (!isTelegramConfigured()) return false;
  return sendTelegramMessage(buildNewGigsSyncedMessage(stats));
}

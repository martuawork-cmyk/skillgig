import { requireAdmin } from '@/lib/supabase/admin';
import { adminListSubscribersWithSkill } from '@/lib/supabase/admin-queries';

/**
 * CSV download of the subscribers list. Same admin gate as the page itself —
 * the route group layout will also redirect non-admins, but we re-check here
 * so this handler is safe even if someone moves it later.
 *
 * Columns: created_at, email, skill_name, skill_category.
 * Per RFC 4180: values containing comma / quote / newline are wrapped in
 * double-quotes, with embedded quotes doubled. UTF-8 BOM prepended so Excel
 * opens it with Indonesian characters intact.
 */

const BOM = '﻿';

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  await requireAdmin('/admin/subscribers');
  const subs = await adminListSubscribersWithSkill();

  const header = ['created_at', 'email', 'skill_name', 'skill_category'];
  const rows = subs.map((s) => [
    s.createdAt,
    s.email,
    s.skillName ?? '',
    s.skillCategory ?? '',
  ]);

  const lines = [header, ...rows].map((cols) => cols.map(csvEscape).join(','));
  const body = BOM + lines.join('\r\n');

  const filename = `skillgig-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(body, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${filename}"`,
      'cache-control': 'no-store',
    },
  });
}

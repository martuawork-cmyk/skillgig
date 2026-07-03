// POST /api/cv-review — AI CV review (Google Gemini).
// -----------------------------------------------------------------------------
// Body: { cvText: string, jobTitle?: string, jobDescription?: string }
// 200 { ok: true, result }         review succeeded
// 400 { ok: false, error }         empty / too-short CV
// 429 { ok: false, error }         per-IP rate limit hit
// 503 { ok: false, error }         GEMINI_API_KEY not set / upstream down
// -----------------------------------------------------------------------------
// Free-tier gating (1 free review per visitor) is enforced client-side via
// localStorage — deliberately: it's a low-friction hook, not a security
// boundary. The real spend guard here is the per-IP rate limit below, which
// caps how fast one source can burn Gemini quota regardless of the client.

import { NextResponse } from 'next/server';
import { reviewCV, CvReviewFailure } from '@/lib/cv-review';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ---- Best-effort per-IP rate limit (in-memory; per serverless instance) -----
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_PER_WINDOW = 8; // reviews per IP per hour
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  return fwd ? fwd.split(',')[0].trim() : 'unknown';
}

export async function POST(req: Request): Promise<Response> {
  if (rateLimited(clientIp(req))) {
    return NextResponse.json(
      { ok: false, error: 'Terlalu banyak permintaan. Coba lagi nanti.' },
      { status: 429 },
    );
  }

  let body: { cvText?: unknown; jobTitle?: unknown; jobDescription?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Body tidak valid.' }, { status: 400 });
  }

  const cvText = typeof body.cvText === 'string' ? body.cvText : '';
  const jobTitle = typeof body.jobTitle === 'string' ? body.jobTitle : undefined;
  const jobDescription =
    typeof body.jobDescription === 'string' ? body.jobDescription : undefined;

  try {
    const result = await reviewCV({ cvText, jobTitle, jobDescription });
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    if (err instanceof CvReviewFailure) {
      switch (err.detail.kind) {
        case 'empty':
          return NextResponse.json(
            { ok: false, error: 'Teks CV terlalu pendek. Tempel isi CV lengkap kamu.' },
            { status: 400 },
          );
        case 'no-key':
          return NextResponse.json(
            { ok: false, error: 'Fitur review CV belum aktif (API key belum diset).' },
            { status: 503 },
          );
        case 'upstream':
        case 'parse':
          // eslint-disable-next-line no-console
          console.error('[cv-review] failed:', err.detail);
          return NextResponse.json(
            {
              ok: false,
              error: 'Gagal memproses review. Coba lagi sebentar.',
              // Short upstream reason to aid debugging (e.g. a model name issue).
              detail: err.detail.message,
            },
            { status: 503 },
          );
      }
    }
    // eslint-disable-next-line no-console
    console.error('[cv-review] unexpected:', err);
    return NextResponse.json({ ok: false, error: 'Terjadi kesalahan.' }, { status: 500 });
  }
}

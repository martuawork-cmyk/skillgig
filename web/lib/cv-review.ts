import 'server-only';

// =============================================================================
// AI CV Review — the first paid feature (Learn/Build monetised as a service).
// -----------------------------------------------------------------------------
// Sends a candidate's CV text (+ optional target role) to Google Gemini and
// returns structured, ATS-oriented feedback in Indonesian. Provider chosen for
// a genuinely free tier (hemat budget for an MVP) and low latency; swappable —
// only this file talks to the LLM. No SDK: a single fetch to the REST endpoint
// keeps the dependency surface (and cold-start) minimal.
//
// Requires env GEMINI_API_KEY. When unset, callers get a typed 'no-key' error
// so the API route can respond 503 instead of throwing.
// =============================================================================

const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const FETCH_TIMEOUT_MS = 30_000;
/** Cap input so a pasted book can't run up the bill / blow the context. */
const MAX_CV_CHARS = 15_000;
const MAX_JOB_CHARS = 4_000;

export type CvReviewInput = {
  cvText: string;
  jobTitle?: string;
  jobDescription?: string;
};

export type CvReviewResult = {
  /** 0–100 overall readiness / ATS score. */
  score: number;
  /** 2–3 sentence overall assessment (Indonesian). */
  summary: string;
  strengths: string[];
  improvements: string[];
  atsIssues: string[];
  missingKeywords: string[];
  /** An improved professional-summary paragraph the candidate can paste in. */
  rewrittenSummary: string;
  /** A tailored cover-letter draft. */
  coverLetter: string;
};

export type CvReviewError =
  | { kind: 'no-key' }
  | { kind: 'empty' }
  | { kind: 'upstream'; message: string }
  | { kind: 'parse'; message: string };

export class CvReviewFailure extends Error {
  constructor(public readonly detail: CvReviewError) {
    super(detail.kind);
    this.name = 'CvReviewFailure';
  }
}

function buildPrompt(input: CvReviewInput): string {
  const cv = input.cvText.slice(0, MAX_CV_CHARS).trim();
  const role = input.jobTitle?.trim();
  const jd = input.jobDescription?.slice(0, MAX_JOB_CHARS).trim();

  const target = role
    ? `Posisi yang dituju: "${role}".${jd ? `\nDeskripsi lowongan:\n${jd}` : ''}`
    : 'Tidak ada posisi spesifik — nilai untuk peran remote global secara umum.';

  return [
    'Kamu adalah reviewer CV profesional dan ahli ATS (Applicant Tracking System) untuk pelamar kerja remote global asal Indonesia.',
    'Tinjau CV di bawah ini secara kritis, jujur, dan actionable. Fokus pada: kejelasan, dampak terukur (angka/hasil), keyword relevan, keramahan ATS, dan kecocokan dengan posisi.',
    'Tulis SEMUA output dalam Bahasa Indonesia yang profesional, KECUALI cover letter: sesuaikan bahasanya dengan bahasa lowongan (Inggris bila lowongan berbahasa Inggris).',
    '',
    target,
    '',
    '=== CV KANDIDAT ===',
    cv,
    '=== AKHIR CV ===',
    '',
    'Balas HANYA dengan JSON valid (tanpa markdown, tanpa teks lain) dengan struktur persis:',
    '{',
    '  "score": <angka 0-100, kesiapan & keramahan ATS>,',
    '  "summary": "<2-3 kalimat penilaian keseluruhan>",',
    '  "strengths": ["<kekuatan konkret>", ...],',
    '  "improvements": ["<saran perbaikan spesifik & actionable>", ...],',
    '  "atsIssues": ["<masalah format/struktur yang menyulitkan ATS>", ...],',
    '  "missingKeywords": ["<keyword relevan yang sebaiknya ada>", ...],',
    '  "rewrittenSummary": "<paragraf ringkasan profil profesional yang sudah diperbaiki, siap tempel>",',
    '  "coverLetter": "<draft cover letter yang disesuaikan, 3-4 paragraf>"',
    '}',
  ].join('\n');
}

/** Coerce Gemini's JSON (which may arrive fenced) into our result shape. */
function parseResult(raw: string): CvReviewResult {
  let text = raw.trim();
  // Strip ```json … ``` fences if the model added them despite instructions.
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(text);
  } catch {
    throw new CvReviewFailure({ kind: 'parse', message: 'model did not return JSON' });
  }
  const arr = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  const str = (v: unknown): string => (typeof v === 'string' ? v : '');
  const scoreRaw = typeof obj.score === 'number' ? obj.score : Number(obj.score);
  const score = Number.isFinite(scoreRaw) ? Math.max(0, Math.min(100, Math.round(scoreRaw))) : 0;

  return {
    score,
    summary: str(obj.summary),
    strengths: arr(obj.strengths),
    improvements: arr(obj.improvements),
    atsIssues: arr(obj.atsIssues),
    missingKeywords: arr(obj.missingKeywords),
    rewrittenSummary: str(obj.rewrittenSummary),
    coverLetter: str(obj.coverLetter),
  };
}

/**
 * Run an AI CV review. Throws CvReviewFailure with a typed detail so the API
 * route can map it to the right status code.
 */
export async function reviewCV(input: CvReviewInput): Promise<CvReviewResult> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new CvReviewFailure({ kind: 'no-key' });
  if (!input.cvText || input.cvText.trim().length < 80) {
    throw new CvReviewFailure({ kind: 'empty' });
  }

  let res: Response;
  try {
    res = await fetch(`${GEMINI_ENDPOINT}?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(input) }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        },
      }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      cache: 'no-store',
    });
  } catch (err) {
    throw new CvReviewFailure({
      kind: 'upstream',
      message: err instanceof Error ? err.message : 'network',
    });
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new CvReviewFailure({
      kind: 'upstream',
      message: `Gemini ${res.status}: ${body.slice(0, 200)}`,
    });
  }

  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!text) throw new CvReviewFailure({ kind: 'parse', message: 'empty completion' });

  return parseResult(text);
}

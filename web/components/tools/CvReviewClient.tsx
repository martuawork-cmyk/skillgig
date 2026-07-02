'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast, Toast } from '@/components/ui/Toast';
import type { CvReviewResult } from '@/lib/cv-review';
import { extractPdfText } from '@/lib/extract-pdf-text';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

// Free-tier hook: how many reviews before the paywall. Bump when you want a
// bigger launch giveaway; the counter lives in localStorage (a low-friction
// hook, not a hard security boundary — the API also rate-limits per IP).
const FREE_LIMIT = 1;
const USED_KEY = 'sg_cv_reviews_used';
// Remembers a paid email so unlimited access persists across visits. Real
// enforcement is server-side: paid access is granted by the Mayar webhook and
// confirmed via /api/cv-review/access.
const UNLOCK_KEY = 'sg_cv_unlocked';

export function CvReviewClient() {
  const { toast, showToast } = useToast();
  const [cvText, setCvText] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CvReviewResult | null>(null);
  const [extracting, setExtracting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (file.size > MAX_UPLOAD_BYTES) {
      setError('File terlalu besar (maks 5 MB).');
      return;
    }
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isTxt = file.type.startsWith('text/') || file.name.toLowerCase().endsWith('.txt');
    if (!isPdf && !isTxt) {
      setError('Format tidak didukung. Unggah PDF atau TXT, atau tempel teks.');
      return;
    }
    setExtracting(true);
    try {
      const text = isPdf ? await extractPdfText(file) : await file.text();
      setCvText(text.trim());
      showToast('Teks CV berhasil diambil', 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membaca file.');
    } finally {
      setExtracting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }
  const [used, setUsed] = useState(0);
  const [unlocked, setUnlocked] = useState<string | null>(null);

  // Paywall form + flow state.
  const [payName, setPayName] = useState('');
  const [payEmail, setPayEmail] = useState('');
  const [payMobile, setPayMobile] = useState('');
  const [payLoading, setPayLoading] = useState(false);
  const [accessMsg, setAccessMsg] = useState<string | null>(null);

  async function checkAccess(email: string, opts?: { quiet?: boolean }) {
    const target = email.trim();
    if (!target) return;
    try {
      const res = await fetch(`/api/cv-review/access?email=${encodeURIComponent(target)}`);
      const data = await res.json();
      if (data.active) {
        setUnlocked(target);
        localStorage.setItem(UNLOCK_KEY, target);
        showToast('Akses penuh aktif 🎉', 'success');
      } else if (!opts?.quiet) {
        setAccessMsg('Pembayaran belum terdeteksi. Jika baru saja bayar, tunggu sebentar lalu cek lagi.');
      }
    } catch {
      if (!opts?.quiet) setAccessMsg('Gagal cek akses. Coba lagi.');
    }
  }

  useEffect(() => {
    const n = Number(localStorage.getItem(USED_KEY) ?? '0');
    setUsed(Number.isFinite(n) ? n : 0);
    const savedEmail = localStorage.getItem(UNLOCK_KEY);
    if (savedEmail) {
      setUnlocked(savedEmail);
      setPayEmail(savedEmail);
    }
    // Returning from a Mayar checkout: ?paid=1&email=… → auto-verify access.
    const params = new URLSearchParams(window.location.search);
    if (params.get('paid') === '1') {
      const e = params.get('email') ?? savedEmail ?? '';
      if (e) {
        setPayEmail(e);
        void checkAccess(e, { quiet: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const locked = used >= FREE_LIMIT && !unlocked;

  async function startCheckout() {
    setAccessMsg(null);
    if (!payName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payEmail) || payMobile.trim().length < 6) {
      setAccessMsg('Lengkapi nama, email valid, dan nomor HP.');
      return;
    }
    setPayLoading(true);
    try {
      const res = await fetch('/api/cv-review/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: payName, email: payEmail, mobile: payMobile }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setAccessMsg(data.error ?? 'Gagal membuat link pembayaran.');
        return;
      }
      localStorage.setItem(UNLOCK_KEY, payEmail.trim()); // remember for return check
      window.location.href = data.link;
    } catch {
      setAccessMsg('Koneksi bermasalah. Coba lagi.');
    } finally {
      setPayLoading(false);
    }
  }

  async function onSubmit() {
    if (loading) return;
    setError(null);
    if (cvText.trim().length < 80) {
      setError('Tempel isi CV kamu dulu (minimal beberapa baris).');
      return;
    }
    if (locked) return;

    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/cv-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvText, jobTitle, jobDescription }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Gagal memproses review.');
        return;
      }
      setResult(data.result as CvReviewResult);
      const next = used + 1;
      setUsed(next);
      localStorage.setItem(USED_KEY, String(next));
    } catch {
      setError('Koneksi bermasalah. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  function copy(text: string, label: string) {
    navigator.clipboard?.writeText(text).then(
      () => showToast(`${label} disalin`),
      () => showToast('Gagal menyalin'),
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Input */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardBody className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1">
                Isi CV kamu <span className="text-rose-500">*</span>
              </label>
              <p className="text-xs text-slate-500 mb-2">
                Unggah PDF/TXT (diproses di browser kamu) atau tempel teksnya.
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.txt,application/pdf,text/plain"
                onChange={(e) => handleFile(e.target.files?.[0])}
                className="hidden"
                id="cv-file"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={extracting}
                className="w-full mb-2 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm font-medium text-slate-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition disabled:opacity-60"
              >
                {extracting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                    Mengambil teks dari PDF…
                  </>
                ) : (
                  <>📎 Unggah PDF / TXT CV kamu</>
                )}
              </button>
              <textarea
                value={cvText}
                onChange={(e) => setCvText(e.target.value)}
                rows={12}
                placeholder="Tempel isi CV di sini…"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none resize-y"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1">
                Posisi yang dituju <span className="text-slate-400 font-normal">(opsional)</span>
              </label>
              <input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="mis. Frontend Engineer (Remote)"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1">
                Deskripsi lowongan <span className="text-slate-400 font-normal">(opsional)</span>
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={4}
                placeholder="Tempel deskripsi lowongan agar review lebih spesifik…"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none resize-y"
              />
            </div>

            {error && (
              <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {locked ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    Jatah review gratis kamu sudah terpakai 🎉
                  </p>
                  <p className="text-xs text-amber-800 mt-1">
                    Buka akses penuh — review CV tanpa batas. Bayar sekali via Mayar.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <input
                    value={payName}
                    onChange={(e) => setPayName(e.target.value)}
                    placeholder="Nama"
                    className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500"
                  />
                  <input
                    type="email"
                    value={payEmail}
                    onChange={(e) => setPayEmail(e.target.value)}
                    placeholder="Email (untuk akses)"
                    className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500"
                  />
                  <input
                    value={payMobile}
                    onChange={(e) => setPayMobile(e.target.value)}
                    placeholder="Nomor HP"
                    className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500"
                  />
                </div>
                {accessMsg && <p className="text-xs text-amber-900">{accessMsg}</p>}
                <button
                  type="button"
                  onClick={startCheckout}
                  disabled={payLoading}
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-lg hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 transition"
                >
                  {payLoading ? 'Menyiapkan pembayaran…' : 'Bayar & buka akses penuh →'}
                </button>
                <button
                  type="button"
                  onClick={() => checkAccess(payEmail)}
                  className="w-full text-xs font-semibold text-amber-800 hover:text-amber-900 underline"
                >
                  Sudah bayar? Cek akses
                </button>
              </div>
            ) : (
              <Button onClick={onSubmit} disabled={loading} size="lg" className="w-full">
                {loading ? 'Menganalisa CV…' : '✨ Review CV saya'}
              </Button>
            )}
            <p className="text-[11px] text-slate-400 text-center">
              {unlocked
                ? '✓ Akses penuh aktif — review tanpa batas'
                : FREE_LIMIT - used > 0
                  ? `${FREE_LIMIT - used} review gratis tersisa`
                  : 'Review gratis habis'}
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Result */}
      <div className="lg:col-span-3">
        {!result && !loading && (
          <Card className="h-full">
            <CardBody className="h-full grid place-items-center text-center py-16">
              <div>
                <div className="text-4xl mb-3">📄✨</div>
                <p className="font-semibold text-slate-700">Hasil review muncul di sini</p>
                <p className="text-sm text-slate-500 mt-1 max-w-sm">
                  AI akan menilai skor kesiapan, keramahan ATS, kekuatan, perbaikan,
                  keyword, plus draft cover letter.
                </p>
              </div>
            </CardBody>
          </Card>
        )}

        {loading && (
          <Card className="h-full">
            <CardBody className="h-full grid place-items-center py-16">
              <div className="text-center">
                <div className="w-10 h-10 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm text-slate-600">Menganalisa CV kamu…</p>
              </div>
            </CardBody>
          </Card>
        )}

        {result && (
          <div className="space-y-4">
            <Card>
              <CardBody className="flex items-center gap-5">
                <ScoreRing score={result.score} />
                <div className="min-w-0">
                  <h2 className="font-bold text-slate-900">Skor kesiapan CV</h2>
                  <p className="text-sm text-slate-600 mt-1">{result.summary}</p>
                </div>
              </CardBody>
            </Card>

            <ListCard title="✅ Kekuatan" items={result.strengths} tone="emerald" />
            <ListCard title="🔧 Yang perlu diperbaiki" items={result.improvements} tone="amber" />
            <ListCard title="🤖 Isu ATS" items={result.atsIssues} tone="slate" />

            {result.missingKeywords.length > 0 && (
              <Card>
                <CardBody>
                  <h3 className="font-bold text-slate-900 mb-3">🏷️ Keyword yang sebaiknya ada</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.missingKeywords.map((k) => (
                      <Badge key={k} className="bg-indigo-100 text-indigo-700">{k}</Badge>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}

            {result.rewrittenSummary && (
              <CopyCard
                title="📝 Ringkasan profil (versi perbaikan)"
                body={result.rewrittenSummary}
                onCopy={() => copy(result.rewrittenSummary, 'Ringkasan')}
              />
            )}
            {result.coverLetter && (
              <CopyCard
                title="✉️ Draft cover letter"
                body={result.coverLetter}
                onCopy={() => copy(result.coverLetter, 'Cover letter')}
              />
            )}
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} tone={toast.tone} />}
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const tone =
    score >= 75 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-rose-600';
  return (
    <div className={`shrink-0 grid place-items-center w-20 h-20 rounded-full border-4 border-current ${tone}`}>
      <span className="text-2xl font-extrabold leading-none">{score}</span>
    </div>
  );
}

function ListCard({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: 'emerald' | 'amber' | 'slate';
}) {
  if (items.length === 0) return null;
  const dot =
    tone === 'emerald' ? 'bg-emerald-500' : tone === 'amber' ? 'bg-amber-500' : 'bg-slate-400';
  return (
    <Card>
      <CardBody>
        <h3 className="font-bold text-slate-900 mb-3">{title}</h3>
        <ul className="space-y-2">
          {items.map((it, i) => (
            <li key={i} className="flex gap-2.5 text-sm text-slate-700">
              <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}

function CopyCard({
  title,
  body,
  onCopy,
}: {
  title: string;
  body: string;
  onCopy: () => void;
}) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-center justify-between mb-3 gap-2">
          <h3 className="font-bold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onCopy}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 px-2 py-1 rounded-md hover:bg-indigo-50 transition shrink-0"
          >
            Salin
          </button>
        </div>
        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{body}</p>
      </CardBody>
    </Card>
  );
}

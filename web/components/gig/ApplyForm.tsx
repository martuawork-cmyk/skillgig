'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Toast, useToast } from '@/components/ui/Toast';
import { applyToGigAction } from '@/lib/supabase/apply-action';

const COVER_LETTER_MIN = 50;

export function ApplyForm({
  gigId,
  isAuthed,
  alreadyApplied,
}: {
  gigId: string;
  /** Server-supplied: is the visitor signed in? */
  isAuthed: boolean;
  /** Server-supplied: did this user already submit an application? */
  alreadyApplied: boolean;
}) {
  const router = useRouter();
  const [letter, setLetter] = useState('');
  const [submitting, startTransition] = useTransition();
  const { toast, showToast } = useToast(2200);

  // ---- Unauthenticated ----
  if (!isAuthed) {
    return (
      <Card>
        <CardBody>
          <h3 className="font-bold text-slate-900 mb-1">Login dulu untuk melamar</h3>
          <p className="text-xs text-slate-500 mb-4">
            Lamaran hanya bisa dikirim oleh pengguna yang sudah login.
          </p>
          <Link
            href={`/login?next=${encodeURIComponent(`/gigs/${gigId}`)}`}
            className="block w-full text-center px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Login / Daftar
          </Link>
        </CardBody>
      </Card>
    );
  }

  // ---- Already applied ----
  if (alreadyApplied) {
    return (
      <Card>
        <CardBody>
          <h3 className="font-bold text-slate-900 mb-1">Sudah pernah melamar ✅</h3>
          <p className="text-xs text-slate-500 mb-4">
            Lamaran kamu untuk gig ini sedang ditinjau. Cek perkembangannya di
            halaman Applications.
          </p>
          <Link
            href="/applications"
            className="block w-full text-center px-4 py-2 text-sm font-semibold bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 transition"
          >
            Lihat status lamaran
          </Link>
        </CardBody>
      </Card>
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = letter.trim();
    if (trimmed.length < COVER_LETTER_MIN) {
      showToast(`Cover letter minimal ${COVER_LETTER_MIN} karakter.`, 'error');
      return;
    }

    startTransition(async () => {
      const result = await applyToGigAction(gigId, trimmed);
      if (result.ok) {
        setLetter('');
        showToast('Lamaran terkirim!', 'success');
        // Send the user to their dashboard so they see the new row in context.
        setTimeout(() => router.push('/applications'), 600);
        return;
      }
      showToast(result.message, 'error');
    });
  }

  const remaining = COVER_LETTER_MIN - letter.trim().length;
  const tooShort = letter.trim().length > 0 && letter.trim().length < COVER_LETTER_MIN;

  return (
    <Card>
      <CardBody>
        <h3 className="font-bold text-slate-900 mb-1">Apply untuk gig ini</h3>
        <p className="text-xs text-slate-500 mb-4">
          Ceritakan kenapa kamu kandidat yang tepat untuk project ini.
        </p>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cover letter
            </label>
            <textarea
              value={letter}
              onChange={(e) => setLetter(e.target.value)}
              rows={6}
              placeholder="Halo! Saya tertarik dengan project ini karena…"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-y"
            />
            <p
              className={`text-[10px] mt-1 ${
                tooShort ? 'text-rose-500' : 'text-slate-400'
              }`}
            >
              {letter.trim().length}/{COVER_LETTER_MIN} karakter
              {tooShort && ` — ${remaining} lagi`}
            </p>
          </div>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Mengirim…' : 'Kirim Lamaran'}
          </Button>

          <p className="text-[10px] text-slate-400 text-center">
            Gig ID: {gigId}
          </p>
        </form>
      </CardBody>

      {toast && <Toast message={toast.message} tone={toast.tone} />}
    </Card>
  );
}

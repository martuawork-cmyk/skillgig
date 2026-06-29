'use client';

import { useState } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function ApplyForm({ gigId }: { gigId: string }) {
  const [rate, setRate] = useState('');
  const [weeks, setWeeks] = useState('');
  const [letter, setLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rate || !weeks || letter.trim().length < 20) {
      setToast('Lengkapi rate, durasi, dan cover letter (min 20 karakter).');
      setTimeout(() => setToast(null), 2400);
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setToast('Lamaran terkirim! (mock — tidak tersimpan di database)');
      setRate(''); setWeeks(''); setLetter('');
      setTimeout(() => setToast(null), 3000);
    }, 600);
  }

  return (
    <Card>
      <CardBody>
        <h3 className="font-bold text-slate-900 mb-1">Apply untuk gig ini</h3>
        <p className="text-xs text-slate-500 mb-4">
          Kirim proposal kamu. Klien akan review dan balas via email.
        </p>

        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rate yang diajukan (IDR)
              </label>
              <input
                type="number"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="12000000"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Durasi (minggu)
              </label>
              <input
                type="number"
                value={weeks}
                onChange={(e) => setWeeks(e.target.value)}
                placeholder="3"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cover letter
            </label>
            <textarea
              value={letter}
              onChange={(e) => setLetter(e.target.value)}
              rows={5}
              placeholder="Halo! Saya tertarik dengan project ini karena…"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-y"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              {letter.length} karakter
            </p>
          </div>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Mengirim…' : 'Kirim Lamaran'}
          </Button>

          <p className="text-[10px] text-slate-400 text-center">
            Gig ID: {gigId} · Phase 1 mock submission
          </p>
        </form>
      </CardBody>

      {toast && (
        <div className="px-5 sm:px-6 py-3 border-t border-slate-100 bg-emerald-50 text-emerald-700 text-sm font-medium">
          ✓ {toast}
        </div>
      )}
    </Card>
  );
}
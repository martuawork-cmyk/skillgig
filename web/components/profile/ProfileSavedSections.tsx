'use client';

import { Bookmark } from 'lucide-react';
import { useSavedStore } from '@/lib/store/savedStore';
import { SavedItemsGrid } from './SavedItemsGrid';

/**
 * Client wrapper that reads saved items from the global Zustand store and
 * renders the saved sections inside the /profile page (which is a Server
 * Component and can't read the store directly).
 *
 * Hydration safety: until the persist middleware rehydrates from localStorage,
 * we render a single loading state to avoid hydration mismatch warnings.
 */
export function ProfileSavedSections() {
  const savedCourses = useSavedStore((s) => s.savedCourses);
  const savedGigs = useSavedStore((s) => s.savedGigs);
  const skillAlerts = useSavedStore((s) => s.skillAlerts);
  const hydrated = useSavedStore((s) => s._hasHydrated);

  if (!hydrated) {
    return (
      <div className="text-sm text-slate-500 py-6 text-center">
        Memuat simpanan…
      </div>
    );
  }

  const hasAny = savedCourses.length > 0 || savedGigs.length > 0 || skillAlerts.length > 0;
  if (!hasAny) {
    return (
      <div className="text-center py-12 px-4 bg-gradient-to-b from-slate-50 to-white border border-dashed border-slate-200 rounded-2xl">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 grid place-items-center mb-4">
          <Bookmark className="h-7 w-7 text-indigo-500" />
        </div>
        <p className="text-sm font-bold text-slate-800">Belum ada yang disimpan</p>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
          Simpan kursus dan gig favorit untuk kembali lagi nanti.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <a
            href="/gigs"
            className="inline-flex items-center gap-1 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition active:scale-[.98]"
          >
            Jelajahi gig →
          </a>
          <a
            href="/learn"
            className="inline-flex items-center gap-1 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:border-indigo-300 hover:text-indigo-700 transition"
          >
            Lihat kursus
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SavedItemsGrid type="course" title="📚 Kursus tersimpan" items={savedCourses} />
      <SavedItemsGrid type="gig" title="💼 Gig tersimpan" items={savedGigs} />

      {skillAlerts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-slate-900">🔔 Skill alerts</h2>
            <span className="text-xs text-slate-500">{skillAlerts.length} aktif</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {skillAlerts.map((a) => (
              <span
                key={a.skillId}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-xs font-semibold"
              >
                <span aria-hidden>{a.skillIcon || '🔔'}</span>
                {a.skillName}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

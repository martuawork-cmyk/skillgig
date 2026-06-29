'use client';

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
      <div className="text-center py-10 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
        <p className="text-2xl mb-1">📌</p>
        <p className="text-sm font-semibold text-slate-700">Belum ada yang disimpan</p>
        <p className="text-xs text-slate-500 mt-1">
          Mulai save kursus & gig favorit dari <a href="/learn" className="text-indigo-600 font-semibold hover:underline">/learn</a> atau{' '}
          <a href="/earn" className="text-indigo-600 font-semibold hover:underline">/earn</a>.
        </p>
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

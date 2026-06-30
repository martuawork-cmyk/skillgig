'use client';

import { useState, useTransition } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { categoryColor, categoryLabel, levelColor, levelLabel } from '@/lib/utils';
import type { Skill } from '@/lib/types';
import { removeUserSkill } from '@/lib/supabase/actions';

/**
 * "Skill Saya" section of /skills.
 *
 * Renders the user's bag as a 1–2 col responsive grid. Each card shows the
 * skill name, category badge, level badge, and a Hapus button that calls the
 * server action. Local `removing` state disables the button mid-flight and
 * optimistically hides the card so the grid stays responsive.
 *
 * Non-fatal failures from `removeUserSkill` re-show the card with the
 * server-side message surfaced in a small inline alert.
 */
export function MySkillsGrid({ skills }: { skills: Skill[] }) {
  const [bag, setBag] = useState<Skill[]>(skills);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleRemove(skill: Skill) {
    setError(null);
    setRemovingId(skill.id);
    // Optimistic update — hide the card immediately.
    const prev = bag;
    setBag(bag.filter((s) => s.id !== skill.id));

    startTransition(async () => {
      const res = await removeUserSkill(skill.id);
      setRemovingId(null);
      if (!res.ok) {
        // Roll back if the server rejected it.
        setBag(prev);
        setError(res.message);
      }
    });
  }

  if (bag.length === 0) {
    return (
      <EmptyState
        icon="🧰"
        title="Belum ada skill di profil kamu"
        description="Pilih dari katalog di bawah untuk mulai membangun skill pertamamu."
      />
    );
  }

  return (
    <>
      {error && (
        <div
          role="alert"
          className="mb-3 px-3 py-2 text-xs font-medium rounded-lg bg-rose-50 text-rose-700 border border-rose-200"
        >
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {bag.map((s) => (
          <div
            key={s.id}
            className="p-4 sm:p-5 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-900 truncate">{s.name}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <Badge className={categoryColor(s.category)}>
                    {categoryLabel(s.category)}
                  </Badge>
                  <Badge className={levelColor(s.level)}>
                    {levelLabel(s.level)}
                  </Badge>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                disabled={removingId === s.id}
                onClick={() => handleRemove(s)}
                aria-label={`Hapus skill ${s.name}`}
                className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              >
                {removingId === s.id ? '…' : 'Hapus'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

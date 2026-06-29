'use client';

import { useMemo, useState } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { ButtonLink } from '@/components/ui/Button';
import { StatsGrid } from '@/components/ui/StatsGrid';
import { FilterPills } from '@/components/ui/FilterPills';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkillProgressBar } from '@/components/skill/SkillProgressBar';
import { userSkills, recommendedSkills } from '@/lib/mock';
import { CATEGORIES, type GigCategory } from '@/lib/types';

type SkillSort = 'progress-high' | 'progress-low' | 'name';
type SkillCat = GigCategory | 'all';

export default function SkillsPage() {
  const [category, setCategory] = useState<SkillCat>('all');
  const [sort, setSort] = useState<SkillSort>('progress-high');

  // Stats
  const avgProgress = Math.round(
    userSkills.reduce((sum, s) => sum + s.progress, 0) / userSkills.length,
  );
  const mastered = userSkills.filter((s) => s.progress >= 75).length;
  const learning = userSkills.filter((s) => s.progress > 0 && s.progress < 75).length;

  const filtered = useMemo(() => {
    let list = [...userSkills];
    if (category !== 'all') list = list.filter((s) => s.category === category);
    if (sort === 'progress-high') list.sort((a, b) => b.progress - a.progress);
    else if (sort === 'progress-low') list.sort((a, b) => a.progress - b.progress);
    else list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [category, sort]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <header>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-2">
          <span>🛠️</span> STEP 2 OF 5
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Bangun skill kamu
        </h1>
        <p className="mt-2 text-slate-600 max-w-2xl">
          Track progress skill kamu. Setelah cukup mahir, langsung cari gig yang
          sesuai di step Discover Gig.
        </p>
      </header>

      {/* Stats */}
      <StatsGrid
        cols={3}
        stats={[
          { label: 'Rata-rata progress', value: `${avgProgress}%`, accent: 'from-indigo-500 to-violet-500', icon: '📈' },
          { label: 'Skill dikuasai',     value: mastered,         accent: 'from-emerald-500 to-emerald-600', icon: '🏆' },
          { label: 'Sedang dipelajari',  value: learning,         accent: 'from-amber-500 to-amber-600', icon: '📖' },
        ]}
      />

      {/* Filter + sort bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <FilterPills<SkillCat>
          items={[
            { value: 'all', label: 'Semua' },
            ...CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
          ]}
          active={category}
          onChange={setCategory}
          ariaLabel="Filter skill berdasarkan kategori"
        />
        <label className="flex items-center gap-2 text-sm text-slate-600 shrink-0">
          <span>Sort:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SkillSort)}
            className="px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="progress-high">Progress tertinggi</option>
            <option value="progress-low">Progress terendah</option>
            <option value="name">Nama A–Z</option>
          </select>
        </label>
      </div>

      {/* Current skills */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Skill kamu</h2>
          <span className="text-xs text-slate-500">{filtered.length} dari {userSkills.length} skill</span>
        </div>
        {filtered.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="Tidak ada skill untuk kategori ini."
            action={
              <button
                onClick={() => setCategory('all')}
                className="text-sm text-indigo-600 font-semibold hover:underline"
              >
                Lihat semua skill →
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((s) => (
              <SkillProgressBar key={s.id} skill={s} />
            ))}
          </div>
        )}
      </section>

      {/* Recommended */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Rekomendasi skill berikutnya</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendedSkills.map((s) => (
            <Card key={s.id} className="hover:border-indigo-300 transition">
              <CardBody className="space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-slate-900">{s.name}</h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-indigo-100 text-indigo-700">
                    New
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Pelajari skill ini untuk membuka lebih banyak peluang gig dan meningkatkan
                  nilai kamu di pasar.
                </p>
                <ButtonLink href="/learn" variant="secondary" size="sm" className="w-full">
                  Mulai belajar
                </ButtonLink>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
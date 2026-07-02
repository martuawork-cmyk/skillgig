'use client';

import { useCallback, useEffect, useState } from 'react';
import { Compass } from 'lucide-react';
import { SkillAutocomplete, type SkillHit } from './SkillAutocomplete';
import { RoadmapSkeleton } from './RoadmapSkeleton';
import {
  RealRoadmapTimeline,
  type RealRoadmapEstimate,
} from './RealRoadmapTimeline';
import type { Course, Gig } from '@/lib/types';

// ============================================================================
// RoadmapExplorer (P2-C)
// ----------------------------------------------------------------------------
// Two stages:
//   1. Autocomplete search — picks a skill (debounced inside <SkillAutocomplete>).
//   2. Fetch payload — GET /api/roadmap/[skillId] returns top courses, gigs,
//      and an AVG budget estimate, all driven by the skill's category.
//
// Loading state: <RoadmapSkeleton/> (header + 4 step rows in animate-pulse).
// Empty state: when the API returns no courses AND no gigs AND no estimate,
// we show a friendly "no data for this category" card with a "try another
// skill" action.
// ============================================================================

type FetchState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ok'; courses: Course[]; gigs: Gig[]; estimate: RealRoadmapEstimate }
  | { kind: 'error'; message: string };

export function RoadmapExplorer() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<SkillHit | null>(null);
  const [state, setState] = useState<FetchState>({ kind: 'idle' });

  const loadRoadmap = useCallback(async (hit: SkillHit) => {
    setState({ kind: 'loading' });
    try {
      const res = await fetch(`/api/roadmap/${encodeURIComponent(hit.id)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg =
          (body && typeof body === 'object' && 'message' in body
            ? (body as { message?: string }).message
            : null) ??
          (res.status === 503
            ? 'Database belum tersedia.'
            : 'Gagal memuat roadmap.');
        setState({ kind: 'error', message: msg });
        return;
      }
      const data = (await res.json()) as {
        ok: true;
        courses: Course[];
        gigs: Gig[];
        estimate: RealRoadmapEstimate;
      };
      setState({
        kind: 'ok',
        courses: data.courses,
        gigs: data.gigs,
        estimate: data.estimate,
      });
    } catch {
      setState({ kind: 'error', message: 'Gagal terhubung ke server.' });
    }
  }, []);

  // Fetch whenever the user commits a new skill. `selected` is the source
  // of truth — `query` only mirrors the input value.
  useEffect(() => {
    if (selected) {
      void loadRoadmap(selected);
    }
  }, [selected, loadRoadmap]);

  function onPick(hit: SkillHit) {
    setSelected(hit);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 200, behavior: 'smooth' });
    }
  }

  function reset() {
    setSelected(null);
    setQuery('');
    setState({ kind: 'idle' });
  }

  const isEmpty =
    state.kind === 'ok' &&
    state.courses.length === 0 &&
    state.gigs.length === 0 &&
    state.estimate.avgBudgetMin === null;

  return (
    <div className="space-y-6">
      {/* Sticky search bar */}
      <div className="sticky top-16 z-20 -mx-4 px-4 py-3 bg-slate-50/95 backdrop-blur border-b border-slate-200/50">
        <div className="space-y-2">
          <label htmlFor="roadmap-search" className="sr-only">
            Cari skill
          </label>
          <SkillAutocomplete
            value={query}
            onChange={setQuery}
            onSelect={onPick}
          />
          <p className="text-[11px] text-slate-500 px-1">
            Ketik minimal 1 huruf — hasil muncul otomatis di bawah input.
            Pilih skill untuk lihat kursus, gig, dan estimasi pendapatan.
          </p>
        </div>
      </div>

      {/* Result */}
      {!selected && state.kind === 'idle' && <EmptyPickState />}

      {selected && state.kind === 'loading' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-slate-500">
              Memuat roadmap untuk{' '}
              <span className="font-bold text-slate-900">{selected.name}</span>…
            </p>
          </div>
          <RoadmapSkeleton />
        </div>
      )}

      {selected && state.kind === 'error' && (
        <ErrorState message={state.message} onRetry={() => void loadRoadmap(selected)} />
      )}

      {selected && state.kind === 'ok' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-slate-500">
              Menampilkan roadmap untuk{' '}
              <span className="font-bold text-slate-900">{selected.name}</span>
            </p>
            <button
              onClick={reset}
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              ← Coba skill lain
            </button>
          </div>
          {isEmpty ? (
            <EmptyDataState skillName={selected.name} onRetry={reset} />
          ) : (
            <RealRoadmapTimeline
              skill={selected}
              courses={state.courses}
              gigs={state.gigs}
              estimate={state.estimate}
            />
          )}
        </div>
      )}
    </div>
  );
}

function EmptyPickState() {
  return (
    <div className="text-center py-12 sm:py-16 px-4">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 grid place-items-center mb-4">
        <Compass className="h-8 w-8 text-indigo-500" />
      </div>
      <h2 className="text-lg font-bold text-slate-900 mb-1">
        Ketik skill yang ingin kamu pelajari
      </h2>
      <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
        Dari &ldquo;belum bisa apa-apa&rdquo; sampai &ldquo;bisa menghasilkan&rdquo; &mdash;
        pilih skill untuk lihat kursus, gig, dan estimasi pendapatan.
      </p>
    </div>
  );
}

function EmptyDataState({
  skillName,
  onRetry,
}: {
  skillName: string;
  onRetry: () => void;
}) {
  return (
    <div className="text-center py-12 px-4 bg-white border border-slate-200 rounded-2xl">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 grid place-items-center text-2xl mb-3">
        📭
      </div>
      <h2 className="text-base font-bold text-slate-900 mb-1">
        Belum ada data untuk &ldquo;{skillName}&rdquo;
      </h2>
      <p className="text-sm text-slate-500 max-w-sm mx-auto">
        Belum ada kursus maupun gig published di kategori ini. Coba skill lain.
      </p>
      <button
        onClick={onRetry}
        className="mt-4 text-sm font-semibold text-indigo-600 hover:underline"
      >
        ← Pilih skill lain
      </button>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="text-center py-12 px-4 bg-white border border-rose-200 rounded-2xl">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-100 grid place-items-center text-2xl mb-3">
        ⚠️
      </div>
      <h2 className="text-base font-bold text-slate-900 mb-1">
        Gagal memuat roadmap
      </h2>
      <p className="text-sm text-slate-500 max-w-sm mx-auto">{message}</p>
      <button
        onClick={onRetry}
        className="mt-4 text-sm font-semibold text-indigo-600 hover:underline"
      >
        Coba lagi
      </button>
    </div>
  );
}
'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { GigCategory } from '@/lib/types';

// ============================================================================
// SkillAutocomplete
// ----------------------------------------------------------------------------
// Debounced (300ms) text input + dropdown that lists matching skills from
// Supabase. Fires `onSelect(hit)` only when the user explicitly picks an
// option (click or Enter) — typing alone never commits a value, so the parent
// can keep a separate "selected" state and treat this as the picker.
//
// Dropdown sits flush under the input (absolute positioning, no portal).
// Keyboard support: ↓ / ↑ to navigate, Enter to commit, Esc to close,
// Tab to dismiss without committing.
// ============================================================================

const DEBOUNCE_MS = 300;
const MAX_HITS = 5;

export interface SkillHit {
  id: string;
  name: string;
  category: GigCategory;
  icon: string | null;
}

type FetchState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ok'; hits: SkillHit[] }
  | { kind: 'empty' }
  | { kind: 'error'; message: string };

type Props = {
  /** Current input value (controlled). */
  value: string;
  /** Called whenever the user types — the parent owns the input. */
  onChange: (next: string) => void;
  /** Called when the user commits a hit (click / Enter). */
  onSelect: (hit: SkillHit) => void;
  /** Optional: text shown when the input is empty and the user focuses it. */
  placeholder?: string;
  /** Optional: visually disabled + non-interactive state. */
  disabled?: boolean;
};

export function SkillAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Cari skill, contoh: Video Editing, Web Dev…',
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [state, setState] = useState<FetchState>({ kind: 'idle' });
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  // Stable refs so the debounce timer always reads the latest callbacks.
  // Avoids re-running the effect on every render.
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const fetchHits = useCallback(async (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) {
      setState({ kind: 'idle' });
      return;
    }
    setState({ kind: 'loading' });
    try {
      const res = await fetch(
        `/api/skills/search?term=${encodeURIComponent(trimmed)}`,
      );
      if (!res.ok) {
        setState({
          kind: 'error',
          message: res.status === 503 ? 'Database belum tersedia' : 'Gagal mencari skill',
        });
        return;
      }
      const data = (await res.json()) as
        | { ok: true; hits: SkillHit[] }
        | { ok: false; error: string; message?: string };
      if (!data.ok) {
        setState({ kind: 'error', message: data.message ?? 'Gagal mencari skill' });
        return;
      }
      const hits = data.hits.slice(0, MAX_HITS);
      setState(hits.length === 0 ? { kind: 'empty' } : { kind: 'ok', hits });
      setActive(0);
    } catch {
      setState({ kind: 'error', message: 'Gagal terhubung ke server' });
    }
  }, []);

  // 300ms debounce: re-fetch on value change, but coalesce rapid keystrokes.
  // Cancel pending timer on unmount or before scheduling the next one.
  useEffect(() => {
    const trimmed = value.trim();
    if (!trimmed) {
      setState({ kind: 'idle' });
      return;
    }
    const handle = window.setTimeout(() => {
      void fetchHits(value);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [value, fetchHits]);

  function commit(hit: SkillHit) {
    onSelectRef.current(hit);
    onChange(hit.name);
    setOpen(false);
    setState({ kind: 'ok', hits: [hit] });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (state.kind !== 'ok') {
      if (e.key === 'Escape') setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, state.hits.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const hit = state.hits[active];
      if (hit) commit(hit);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  const showDropdown = open && !disabled && state.kind !== 'idle';
  const hasResults = state.kind === 'ok';

  return (
    <div className="relative">
      <div className="relative">
        {/* Search icon */}
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          id="roadmap-search"
          type="search"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            hasResults && state.hits[active]
              ? `${listboxId}-opt-${state.hits[active].id}`
              : undefined
          }
          autoComplete="off"
          disabled={disabled}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // Delay so click-on-option still fires before the dropdown unmounts.
            window.setTimeout(() => setOpen(false), 120);
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={cn(
            'w-full pl-10 pr-24 py-3 text-sm bg-white border border-slate-200 rounded-xl',
            'focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100',
            'transition disabled:opacity-60 disabled:cursor-not-allowed',
          )}
        />
        {value && !disabled && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setState({ kind: 'idle' });
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-700 rounded-md hover:bg-slate-100"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {showDropdown && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1.5 z-30 max-h-72 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/50 py-1.5"
        >
          {state.kind === 'loading' && (
            <li className="px-3 py-2.5 text-sm text-slate-500 flex items-center gap-2">
              <Spinner />
              Mencari skill…
            </li>
          )}

          {state.kind === 'empty' && (
            <li className="px-3 py-2.5 text-sm text-slate-500">
              Tidak ada skill yang cocok dengan{' '}
              <span className="font-semibold text-slate-700">
                &ldquo;{value.trim()}&rdquo;
              </span>
              .
            </li>
          )}

          {state.kind === 'error' && (
            <li className="px-3 py-2.5 text-sm text-rose-600">
              {state.message}
            </li>
          )}

          {state.kind === 'ok' &&
            state.hits.map((hit, i) => {
              const isActive = i === active;
              return (
                <li
                  key={hit.id}
                  id={`${listboxId}-opt-${hit.id}`}
                  role="option"
                  aria-selected={isActive}
                  onMouseDown={(e) => {
                    // mousedown so we beat input blur's 120ms timeout.
                    e.preventDefault();
                    commit(hit);
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={cn(
                    'px-3 py-2 cursor-pointer flex items-center gap-2.5',
                    isActive ? 'bg-indigo-50' : 'hover:bg-slate-50',
                  )}
                >
                  <span className="text-lg shrink-0" aria-hidden>
                    {hit.icon ?? '✨'}
                  </span>
                  <span
                    className={cn(
                      'text-sm font-medium truncate',
                      isActive ? 'text-indigo-700' : 'text-slate-800',
                    )}
                  >
                    {hit.name}
                  </span>
                  <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-slate-500 shrink-0">
                    {hit.category}
                  </span>
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin w-3.5 h-3.5 text-slate-400"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeOpacity="0.25"
      />
      <path
        d="M22 12a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
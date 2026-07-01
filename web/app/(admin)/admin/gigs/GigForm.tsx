'use client';

import { useRef, useState, useTransition } from 'react';
import { Save, Send, X } from 'lucide-react';
import { createGigAction, updateGigAction } from './actions';
import type { Gig, GigStatus } from '@/lib/types';

const PLATFORMS = ['Upwork', 'Fiverr', 'Projects.co.id', 'Sribulancer'] as const;
const CATEGORIES = [
  { value: 'web-dev', label: 'Web Dev' },
  { value: 'design', label: 'Design' },
  { value: 'writing', label: 'Writing' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'data', label: 'Data' },
  { value: 'video', label: 'Video' },
] as const;
const LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
] as const;
const STATUSES: { value: GigStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'expired', label: 'Expired' },
];

const inputCls =
  'block w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg ' +
  'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ' +
  'focus:border-indigo-500';

type Props = {
  /** Present => edit mode (prefilled); absent => create mode. */
  gig?: Gig | null;
  /** Toast callback owned by the parent console. */
  onToast: (message: string, tone: 'success' | 'error') => void;
  /** Return to the list tab. Called after a successful save or on cancel. */
  onDone: () => void;
};

/**
 * Two-column create/edit gig form. Same fields drive both modes — `gig` only
 * decides initial values and whether we call `createGigAction` or
 * `updateGigAction`. Skills use a chip/tag input that writes a comma-joined
 * string into a hidden `skills` field (the actions split on comma).
 *
 * Status comes from two places: a Status `<select>` and the two footer buttons
 * ("Simpan Draft" / "Publish"). To avoid the async-state race where a button's
 * setState wouldn't have re-rendered the hidden field before submit, we keep a
 * synchronous ref (`statusRef`) that the buttons + select write to on click /
 * change (both fire before the form's action), and `onSubmit` stamps it into
 * the FormData just before calling the action.
 */
export function GigForm({ gig, onToast, onDone }: Props) {
  const editing = !!gig;
  const [isPending, startTransition] = useTransition();
  const [skills, setSkills] = useState<string[]>(gig?.skillsRequired ?? []);
  const [skillInput, setSkillInput] = useState('');
  const [status, setStatus] = useState<GigStatus>(gig?.status ?? 'draft');

  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<GigStatus>(gig?.status ?? 'draft');

  // Keep the display state + the synchronous ref in lockstep. `statusRef` is
  // the value actually saved; `status` only drives the <select> UI.
  const applyStatus = (next: GigStatus) => {
    statusRef.current = next;
    setStatus(next);
  };

  const onSubmit = (formData: FormData) => {
    formData.set('status', statusRef.current);
    startTransition(async () => {
      const res = editing && gig
        ? await updateGigAction(gig.id, formData)
        : await createGigAction(formData);
      if (res.ok) {
        onToast(editing ? 'Perubahan gig disimpan.' : 'Gig baru dibuat.', 'success');
        if (!editing) formRef.current?.reset();
        onDone();
      } else {
        onToast(res.error, 'error');
      }
    });
  };

  /* ----------------------------- skills chips ---------------------------- */
  const commitSkill = () => {
    const v = skillInput.trim().replace(/,$/, '').trim();
    if (!v) return;
    setSkills((prev) => (prev.includes(v) ? prev : [...prev, v]));
    setSkillInput('');
  };
  const onSkillKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commitSkill();
    } else if (e.key === 'Backspace' && skillInput === '' && skills.length) {
      setSkills((prev) => prev.slice(0, -1));
    }
  };
  const removeSkill = (s: string) => setSkills((prev) => prev.filter((x) => x !== s));

  return (
    <form ref={formRef} action={onSubmit} className="space-y-5">
      {/* Hidden field so the existing server actions read comma-joined skills. */}
      <input type="hidden" name="skills" value={skills.join(', ')} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Left column --------------------------------------------------- */}
        <div className="space-y-4">
          <Field label="Judul" required>
            <input
              name="title"
              required
              defaultValue={gig?.title}
              placeholder="Build a Next.js landing page…"
              className={inputCls}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Platform">
              <select name="platform" defaultValue={gig?.platform ?? 'Upwork'} className={inputCls}>
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Kategori">
              <select name="category" defaultValue={gig?.category ?? 'web-dev'} className={inputCls}>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Level">
              <select name="level" defaultValue={gig?.level ?? 'beginner'} className={inputCls}>
                {LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select
                value={status}
                onChange={(e) => applyStatus(e.target.value as GigStatus)}
                className={inputCls}
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        {/* Right column -------------------------------------------------- */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Budget Min (IDR)">
              <input
                name="budgetMin"
                type="number"
                min={0}
                defaultValue={gig?.budgetMin ?? 0}
                className={inputCls}
              />
            </Field>
            <Field label="Budget Max (IDR)">
              <input
                name="budgetMax"
                type="number"
                min={0}
                defaultValue={gig?.budgetMax ?? 0}
                className={inputCls}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Durasi (minggu)">
              <input
                name="durationWeeks"
                type="number"
                min={1}
                defaultValue={gig?.durationWeeks ?? 4}
                className={inputCls}
              />
            </Field>
            <Field label="URL Listing" required>
              <input
                name="url"
                required
                type="url"
                defaultValue={gig?.url}
                placeholder="https://…"
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Skills">
            <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-2 focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:border-indigo-500">
              {skills.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 rounded-md bg-indigo-50 py-1 pl-2 pr-1 text-xs font-semibold text-indigo-700"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => removeSkill(s)}
                    className="grid h-4 w-4 place-items-center rounded text-indigo-400 transition hover:bg-indigo-100 hover:text-indigo-700"
                    aria-label={`Hapus skill ${s}`}
                  >
                    <X className="h-3 w-3" aria-hidden />
                  </button>
                </span>
              ))}
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={onSkillKey}
                onBlur={commitSkill}
                placeholder={skills.length ? '' : 'Ketik lalu Enter…'}
                className="min-w-[8rem] flex-1 border-0 bg-transparent p-1 text-sm outline-none placeholder:text-slate-400 focus:ring-0"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Tekan Enter atau koma untuk menambah; Backspace untuk menghapus.
            </p>
          </Field>
        </div>
      </div>

      {/* Full-width description ----------------------------------------- */}
      <Field label="Deskripsi">
        <textarea
          name="description"
          rows={4}
          defaultValue={gig?.descriptionId}
          placeholder="Detail singkat gig…"
          className={inputCls}
        />
      </Field>

      {/* Actions -------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={onDone}
          className="text-sm font-semibold text-slate-500 transition hover:text-slate-700"
        >
          Batal
        </button>
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={isPending}
            onClick={() => applyStatus('draft')}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-soft transition hover:bg-slate-50 active:scale-[.98] disabled:opacity-50"
          >
            <Save className="h-4 w-4" aria-hidden />
            {isPending ? 'Menyimpan…' : 'Simpan Draft'}
          </button>
          <button
            type="submit"
            disabled={isPending}
            onClick={() => applyStatus('published')}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:from-indigo-700 hover:to-violet-700 active:scale-[.98] disabled:opacity-50"
          >
            <Send className="h-4 w-4" aria-hidden />
            {isPending ? 'Menyimpan…' : 'Publish'}
          </button>
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-600">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </span>
      {children}
    </label>
  );
}

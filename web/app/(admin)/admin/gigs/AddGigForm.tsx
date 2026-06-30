'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { createGigAction } from './actions';

const PLATFORMS = ['Upwork', 'Fiverr', 'Projects.co.id', 'Sribulancer'] as const;
const CATEGORIES = [
  { value: 'web-dev',   label: 'Web Dev' },
  { value: 'design',    label: 'Design' },
  { value: 'writing',   label: 'Writing' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'data',      label: 'Data' },
  { value: 'video',     label: 'Video' },
] as const;
const LEVELS = [
  { value: 'beginner',     label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced',     label: 'Advanced' },
] as const;
const STATUSES = [
  { value: 'draft',     label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'expired',   label: 'Expired' },
] as const;

/**
 * Inline create-gig form. Pure server-action driven — no client validation
 * library. On success we clear the form + show a flash; on failure we keep
 * the inputs and show the error.
 */
export function AddGigForm() {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const res = await createGigAction(formData);
      if (res.ok) {
        setFeedback({ ok: true, msg: 'Gig dibuat.' });
        const form = document.getElementById('add-gig-form') as HTMLFormElement | null;
        form?.reset();
      } else {
        setFeedback({ ok: false, msg: res.error });
      }
    });
  };

  return (
    <form
      id="add-gig-form"
      action={handleSubmit}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <Field label="Judul" className="sm:col-span-2 lg:col-span-3" required>
        <input
          name="title"
          required
          placeholder="Build a Next.js landing page..."
          className={inputCls}
        />
      </Field>

      <Field label="Platform">
        <select name="platform" defaultValue="Upwork" className={inputCls}>
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Kategori">
        <select name="category" defaultValue="web-dev" className={inputCls}>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Level">
        <select name="level" defaultValue="beginner" className={inputCls}>
          {LEVELS.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Budget min (IDR)">
        <input
          name="budgetMin"
          type="number"
          min={0}
          defaultValue={0}
          className={inputCls}
        />
      </Field>

      <Field label="Budget max (IDR)">
        <input
          name="budgetMax"
          type="number"
          min={0}
          defaultValue={0}
          className={inputCls}
        />
      </Field>

      <Field label="Durasi (minggu)">
        <input
          name="durationWeeks"
          type="number"
          min={1}
          defaultValue={4}
          className={inputCls}
        />
      </Field>

      <Field label="URL listing" className="sm:col-span-2 lg:col-span-3" required>
        <input
          name="url"
          required
          type="url"
          placeholder="https://..."
          className={inputCls}
        />
      </Field>

      <Field label="Status">
        <select name="status" defaultValue="draft" className={inputCls}>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Skills (pisahkan dengan koma)" className="sm:col-span-2 lg:col-span-3">
        <input
          name="skills"
          placeholder="Next.js, TypeScript, Tailwind CSS"
          className={inputCls}
        />
      </Field>

      <Field label="Deskripsi" className="sm:col-span-2 lg:col-span-3">
        <textarea
          name="description"
          rows={3}
          placeholder="Detail singkat gig..."
          className={inputCls}
        />
      </Field>

      <div className="sm:col-span-2 lg:col-span-3 flex items-center justify-between gap-3 pt-2">
        <Feedback feedback={feedback} />
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Menyimpan…' : 'Tambah gig'}
        </Button>
      </div>
    </form>
  );
}

const inputCls =
  'block w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg ' +
  'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ' +
  'focus:border-indigo-500';

function Field({
  label,
  children,
  className,
  required,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
}) {
  return (
    <label className={`block ${className ?? ''}`}>
      <span className="block text-xs font-semibold text-slate-600 mb-1">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </span>
      {children}
    </label>
  );
}

function Feedback({ feedback }: { feedback: { ok: boolean; msg: string } | null }) {
  if (!feedback) return null;
  return (
    <p
      className={`text-xs font-semibold ${
        feedback.ok ? 'text-emerald-600' : 'text-rose-600'
      }`}
      role="status"
    >
      {feedback.msg}
    </p>
  );
}

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import type { Course } from '@/lib/types';
import { updateCourseAction } from '../actions';

const PLATFORMS = ['Udemy', 'Coursera', 'Dicoding', 'YouTube'] as const;
const CATEGORIES = [
  { value: 'design',    label: 'Design' },
  { value: 'tech',      label: 'Tech' },
  { value: 'marketing', label: 'Marketing' },
] as const;
const LEVELS = [
  { value: 'beginner',     label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced',     label: 'Advanced' },
] as const;

export function EditCourseForm({ course }: { course: Course }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const res = await updateCourseAction(course.id, formData);
      if (res.ok) {
        setFeedback({ ok: true, msg: 'Tersimpan.' });
        router.refresh();
      } else {
        setFeedback({ ok: false, msg: res.error });
      }
    });
  };

  return (
    <form action={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Field label="Judul" className="sm:col-span-2 lg:col-span-3" required>
        <input
          name="title"
          required
          defaultValue={course.title}
          className={inputCls}
        />
      </Field>

      <Field label="Platform">
        <select name="platform" defaultValue={course.platform} className={inputCls}>
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Kategori">
        <select name="category" defaultValue={course.category} className={inputCls}>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Level">
        <select name="level" defaultValue={course.level} className={inputCls}>
          {LEVELS.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Harga (IDR)">
        <input
          name="price"
          type="number"
          min={0}
          defaultValue={course.price}
          className={inputCls}
        />
      </Field>

      <Field label="Durasi (jam)">
        <input
          name="durationHours"
          type="number"
          min={0}
          defaultValue={course.durationHours}
          className={inputCls}
        />
      </Field>

      <Field label="Jumlah siswa">
        <input
          name="students"
          type="number"
          min={0}
          defaultValue={course.students}
          className={inputCls}
        />
      </Field>

      <Field label="Rating (0–5)">
        <input
          name="rating"
          type="number"
          min={0}
          max={5}
          step={0.1}
          defaultValue={course.rating}
          className={inputCls}
        />
      </Field>

      <Field label="Thumbnail (emoji atau URL)" className="sm:col-span-2 lg:col-span-3">
        <input
          name="thumbnail"
          defaultValue={course.thumbnail}
          className={inputCls}
        />
      </Field>

      <Field label="URL kursus" className="sm:col-span-2 lg:col-span-3" required>
        <input
          name="url"
          required
          type="url"
          defaultValue={course.url}
          className={inputCls}
        />
      </Field>

      <Field label="Skills (pisahkan dengan koma)" className="sm:col-span-2 lg:col-span-3">
        <input
          name="skills"
          defaultValue={course.skillsTaught.join(', ')}
          className={inputCls}
        />
      </Field>

      <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-6 pt-1">
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="enrolled"
            defaultChecked={course.enrolled}
            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="font-semibold text-slate-700">Enrolled</span>
        </label>
      </div>

      <div className="sm:col-span-2 lg:col-span-3 flex items-center justify-between gap-3 pt-2">
        <p
          className={`text-xs font-semibold ${
            feedback
              ? feedback.ok
                ? 'text-emerald-600'
                : 'text-rose-600'
              : 'text-slate-500'
          }`}
        >
          {feedback?.msg ?? `Featured: ${course.featured ? 'ya' : 'tidak'} (toggle dari tabel).`}
        </p>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Menyimpan…' : 'Simpan perubahan'}
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

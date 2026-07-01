'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatusBadge } from '@/components/admin/Badge';
import { Toast } from '@/components/admin/Toast';
import { formatIDR, formatDate, categoryColor, categoryLabel } from '@/lib/utils';
import type { Gig, GigCategory, GigStatus } from '@/lib/types';
import { GigForm } from './GigForm';
import { DeleteGigButton } from './DeleteGigButton';

const PAGE_SIZE = 10;

const STATUS_FILTERS: { value: GigStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'expired', label: 'Expired' },
];

const CATEGORY_FILTERS: { value: GigCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Semua kategori' },
  { value: 'web-dev', label: 'Web Dev' },
  { value: 'design', label: 'Design' },
  { value: 'writing', label: 'Writing' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'data', label: 'Data' },
  { value: 'video', label: 'Video' },
];

type Tab = 'list' | 'form';

type Props = {
  gigs: Gig[];
};

/**
 * Full admin gigs workspace. Two tabs: a filterable/searchable/paginated list
 * and an add/edit form. The form tab is reused for both: a null `editing` =>
 * create, a populated `editing` => edit (prefilled). All filter/page state is
 * client-side over the `gigs` prop; the parent server page re-passes fresh
 * props after each server action (create/update/delete all revalidate the
 * route), so the list stays current without manual refetches.
 */
export function GigsConsole({ gigs }: Props) {
  const [tab, setTab] = useState<Tab>('list');
  const [editing, setEditing] = useState<Gig | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  // List controls
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<GigStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<GigCategory | 'all'>('all');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return gigs.filter((g) => {
      if (statusFilter !== 'all' && g.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && g.category !== categoryFilter) return false;
      if (q && !g.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [gigs, query, statusFilter, categoryFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const goList = () => {
    setTab('list');
    setEditing(null);
  };

  const startCreate = () => {
    setEditing(null);
    setTab('form');
  };

  const startEdit = (gig: Gig) => {
    setEditing(gig);
    setTab('form');
  };

  const showToast = (message: string, tone: 'success' | 'error') =>
    setToast({ message, tone });

  const resetPage = () => setPage(0);

  const formTabLabel = editing ? 'Edit Gig' : 'Tambah Gig Baru';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Gigs"
        description="Tambah, edit, filter, dan hapus gig. Edit membuka form di tab terpisah."
      />

      {/* Tabs ---------------------------------------------------------------- */}
      <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
        <TabButton active={tab === 'list'} onClick={goList}>
          Daftar Gig
        </TabButton>
        <TabButton active={tab === 'form'} onClick={startCreate}>
          {formTabLabel}
        </TabButton>
        <span className="ml-auto px-2 text-xs text-slate-400">
          Total gig: <span className="font-bold text-slate-600">{gigs.length}</span>
        </span>
      </div>

      {tab === 'list' ? (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
            <div className="relative min-w-[14rem] flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  resetPage();
                }}
                placeholder="Cari judul gig…"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as GigStatus | 'all');
                resetPage();
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
              aria-label="Filter status"
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value as GigCategory | 'all');
                resetPage();
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
              aria-label="Filter kategori"
            >
              {CATEGORY_FILTERS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Table */}
          {pageRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-5 py-12 text-center">
              <p className="text-sm text-slate-500">
                {gigs.length === 0
                  ? 'Belum ada gig. Tambah listing pertama dari tab "Tambah Gig Baru".'
                  : 'Tidak ada gig yang cocok dengan filter.'}
              </p>
              {gigs.length === 0 && (
                <button
                  type="button"
                  onClick={startCreate}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                  Tambah Gig Baru
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3 font-semibold">Judul</th>
                    <th className="px-5 py-3 font-semibold">Kategori</th>
                    <th className="px-5 py-3 font-semibold">Budget</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Tanggal</th>
                    <th className="px-5 py-3 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((gig) => (
                    <tr key={gig.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                      <td className="max-w-xs px-5 py-3">
                        <div className="truncate font-medium text-slate-900" title={gig.title}>
                          {gig.title}
                        </div>
                        <div className="mt-0.5 truncate text-[11px] text-slate-500">
                          {gig.platform} · {gig.durationWeeks} minggu
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${categoryColor(gig.category)}`}
                        >
                          {categoryLabel(gig.category)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-700">
                        {formatIDR(gig.budgetMin)} – {formatIDR(gig.budgetMax)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={gig.status} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-500">
                        {formatDate(gig.postedAt)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(gig)}
                            className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                          >
                            Edit
                          </button>
                          <DeleteGigButton id={gig.id} title={gig.title} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
              <span>
                Menampilkan{' '}
                <span className="font-semibold text-slate-700">
                  {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, filtered.length)}
                </span>{' '}
                dari <span className="font-semibold text-slate-700">{filtered.length}</span> gig
              </span>
              <div className="flex items-center gap-1">
                <PagerButton disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                  Prev
                </PagerButton>
                <span className="px-2 font-semibold text-slate-700">
                  {safePage + 1} / {pageCount}
                </span>
                <PagerButton disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)}>
                  Next
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </PagerButton>
              </div>
            </div>
          )}
        </section>
      ) : (
        /* Form tab ---------------------------------------------------------- */
        <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="text-sm font-bold text-slate-900">
              {editing ? `Edit: ${editing.title}` : 'Tambah Gig Baru'}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {editing
                ? 'Perubahan disimpan via server action.'
                : 'Listing baru default berstatus Draft — klik Publish untuk langsung memublikasikan.'}
            </p>
          </div>
          <GigForm gig={editing} onToast={showToast} onDone={goList} />
        </section>
      )}

      <Toast
        open={!!toast}
        tone={toast?.tone}
        message={toast?.message ?? ''}
        onClose={() => setToast(null)}
      />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={
        active
          ? 'rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition'
          : 'rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-indigo-600'
      }
    >
      {children}
    </button>
  );
}

function PagerButton({
  disabled,
  onClick,
  children,
}: {
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

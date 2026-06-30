// P4-A perf: streamed skeleton shown while the (force-dynamic) admin dashboard
// resolves its Supabase queries. Plain divs + animate-pulse keep it dependency-
// free so it adds ~nothing to First Load JS.
export default function AdminLoading() {
  return (
    <div className="space-y-6 sm:space-y-8" aria-busy="true" aria-live="polite">
      <header>
        <div className="h-3 w-24 bg-slate-200 rounded animate-pulse mb-2" />
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
        <div className="h-4 w-80 bg-slate-100 rounded animate-pulse mt-3" />
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
            <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
            <div className="h-8 w-16 bg-slate-200 rounded animate-pulse" />
            <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Table-ish list */}
      <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <div className="h-10 w-10 rounded-lg bg-slate-200 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 bg-slate-200 rounded animate-pulse" />
              <div className="h-3 w-56 bg-slate-100 rounded animate-pulse" />
            </div>
            <div className="h-8 w-20 bg-slate-100 rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

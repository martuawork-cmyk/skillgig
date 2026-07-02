/**
 * Streaming skeleton for /jobs — shown while getJobs() resolves on the server.
 * Mirrors the JobsClient layout (centered search, dropdown bar, results grid)
 * with animate-pulse placeholders so the layout doesn't pop on first paint.
 */
export default function JobsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <header className="text-center">
        <div className="mx-auto mb-4 h-6 w-44 animate-pulse rounded-full bg-slate-200" />
        <div className="mx-auto h-9 w-72 animate-pulse rounded-lg bg-slate-200" />
        <div className="mx-auto mt-3 h-4 w-80 animate-pulse rounded bg-slate-100" />
      </header>

      {/* Search */}
      <div className="mx-auto max-w-2xl">
        <div className="h-12 w-full animate-pulse rounded-2xl bg-slate-200" />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {[110, 120, 110].map((w, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-200" style={{ width: w }} />
          ))}
        </div>
        <div className="h-10 w-28 animate-pulse rounded-lg bg-slate-200" />
      </div>

      <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />

      {/* Card grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-200" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
                <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
            <div className="mt-4 h-4 w-3/4 animate-pulse rounded bg-slate-200" />
            <div className="mt-3 flex gap-1.5">
              <div className="h-5 w-16 animate-pulse rounded-full bg-slate-100" />
              <div className="h-5 w-14 animate-pulse rounded-full bg-slate-100" />
              <div className="h-5 w-12 animate-pulse rounded-full bg-slate-100" />
            </div>
            <div className="mt-4 h-3 w-1/2 animate-pulse rounded bg-slate-100" />
            <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
              <div className="h-9 flex-1 animate-pulse rounded-lg bg-slate-200" />
              <div className="h-9 w-20 animate-pulse rounded-lg bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

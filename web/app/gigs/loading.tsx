/**
 * Streaming skeleton for /gigs — shown while getGigs() resolves on the server.
 * Mirrors the GigsClient layout (stats strip, search/sort card, filter sidebar,
 * results grid) with animate-pulse placeholders so the layout doesn't pop on
 * first paint. ≥6 skeleton cards per the loading-spec.
 */
export default function GigsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <header>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-2">
          <span aria-hidden>🔍</span> STEP 3 OF 5
        </div>
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
        <div className="mt-3 h-4 w-80 animate-pulse rounded bg-slate-100" />
      </header>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
            <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
            <div className="mt-2 h-6 w-16 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>

      {/* Search + sort card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 h-10 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-10 w-40 animate-pulse rounded-lg bg-slate-200" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filter sidebar skeleton */}
        <aside className="lg:col-span-1 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft space-y-5">
            {[0, 1, 2].map((g) => (
              <div key={g} className={g > 0 ? 'pt-4 border-t border-slate-100' : ''}>
                <div className="h-3 w-16 animate-pulse rounded bg-slate-200 mb-2" />
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-7 w-full animate-pulse rounded-lg bg-slate-100" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Card grid skeleton */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
            <div className="h-9 w-28 animate-pulse rounded-lg bg-slate-200" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <GigCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function GigCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          <div className="h-5 w-16 animate-pulse rounded-full bg-slate-200" />
          <div className="h-5 w-14 animate-pulse rounded-full bg-slate-100" />
        </div>
        <div className="h-5 w-16 animate-pulse rounded-full bg-slate-100" />
      </div>
      <div className="mt-4 h-4 w-3/4 animate-pulse rounded bg-slate-200" />
      <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-slate-100" />
      <div className="mt-3 flex gap-1.5">
        <div className="h-5 w-14 animate-pulse rounded-md bg-slate-100" />
        <div className="h-5 w-12 animate-pulse rounded-md bg-slate-100" />
        <div className="h-5 w-10 animate-pulse rounded-md bg-slate-100" />
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="mt-3 flex gap-2">
        <div className="h-9 flex-1 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-9 w-20 animate-pulse rounded-lg bg-slate-100" />
      </div>
    </div>
  );
}

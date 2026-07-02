/**
 * Streaming skeleton for /learn — shown while getCourses() resolves on the
 * server. Mirrors the LearnClient layout (stats strip, filter bar, course grid)
 * with animate-pulse placeholders so the layout doesn't pop on first paint.
 * ≥6 skeleton cards per the loading-spec.
 */
export default function LearnLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <header>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-2">
          <span aria-hidden>📚</span> STEP 1 OF 5
        </div>
        <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200" />
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

      {/* Newsletter opt-in placeholder */}
      <div className="h-28 w-full animate-pulse rounded-2xl bg-slate-200" />

      {/* Filter bar placeholder */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {[64, 56, 64, 48].map((w, i) => (
            <div key={i} className="h-9 animate-pulse rounded-full bg-slate-200" style={{ width: w }} />
          ))}
        </div>
        <div className="h-9 w-32 animate-pulse rounded-lg bg-slate-200" />
      </div>

      {/* Card grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <CourseCardSkeleton key={i} />
        ))}
      </div>

      {/* Platform legend placeholder */}
      <div className="h-4 w-72 animate-pulse rounded bg-slate-100" />
    </div>
  );
}

function CourseCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="h-14 w-14 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-5 w-20 animate-pulse rounded-full bg-slate-100" />
      </div>
      <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
      <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
      <div className="flex gap-1.5">
        <div className="h-5 w-14 animate-pulse rounded-md bg-slate-100" />
        <div className="h-5 w-12 animate-pulse rounded-md bg-slate-100" />
        <div className="h-5 w-10 animate-pulse rounded-md bg-slate-100" />
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3">
        <div className="h-5 w-16 animate-pulse rounded bg-slate-200" />
        <div className="h-7 w-20 animate-pulse rounded-lg bg-slate-100" />
      </div>
      <div className="h-10 w-full animate-pulse rounded-lg bg-slate-200" />
    </div>
  );
}

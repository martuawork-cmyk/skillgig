// P4-A perf: streamed skeleton for public profile pages. Mirrors the avatar
// header + saved-items grid so layout doesn't jump when the user row resolves.
export default function ProfileLoading() {
  return (
    <div
      className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8"
      aria-busy="true"
      aria-live="polite"
    >
      {/* Profile header */}
      <header className="flex items-center gap-5">
        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-indigo-300 to-violet-300 animate-pulse shrink-0" />
        <div className="space-y-2">
          <div className="h-7 w-48 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
          <div className="h-3 w-56 bg-slate-100 rounded animate-pulse" />
        </div>
      </header>

      {/* Saved sections grid */}
      <section className="space-y-4">
        <div className="h-5 w-40 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200 bg-white p-5 space-y-3"
            >
              <div className="h-8 w-8 rounded-lg bg-slate-200 animate-pulse" />
              <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
              <div className="h-3 w-full bg-slate-100 rounded animate-pulse" />
              <div className="h-3 w-2/3 bg-slate-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

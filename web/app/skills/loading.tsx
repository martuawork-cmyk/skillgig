// P4-A perf: streamed skeleton for /skills (reads the signed-in user's skill
// bag, so the route is dynamic). Mirrors the page's header + skill-grid shape.
export default function SkillsLoading() {
  return (
    <div
      className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8"
      aria-busy="true"
      aria-live="polite"
    >
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600">
          <span className="h-3 w-20 bg-indigo-100 rounded animate-pulse" />
        </div>
        <div className="h-8 w-72 bg-slate-200 rounded animate-pulse" />
        <div className="h-4 w-96 max-w-full bg-slate-100 rounded animate-pulse" />
      </header>

      {/* "My skills" progress list */}
      <section className="space-y-3">
        <div className="h-5 w-40 bg-slate-200 rounded animate-pulse" />
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="h-10 w-10 rounded-full bg-slate-200 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
              <div className="h-2 w-full bg-slate-100 rounded animate-pulse" />
            </div>
            <div className="h-6 w-16 bg-indigo-100 rounded-full animate-pulse" />
          </div>
        ))}
      </section>

      {/* "Add skill" grid */}
      <section className="space-y-3">
        <div className="h-5 w-40 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div
              key={i}
              className="h-24 rounded-xl border border-slate-200 bg-white p-4 space-y-2"
            >
              <div className="h-8 w-8 rounded-lg bg-slate-200 animate-pulse" />
              <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

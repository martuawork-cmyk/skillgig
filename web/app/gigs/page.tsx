import { GigFilters } from '@/components/gig/GigFilters';

export default function GigsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <header>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-2">
          <span>🔍</span> STEP 3 OF 5
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Discover Gig
        </h1>
        <p className="mt-2 text-slate-600 max-w-2xl">
          Temukan peluang freelance yang sesuai dengan skill kamu. Filter berdasarkan
          kategori, level, dan budget.
        </p>
      </header>

      <GigFilters />
    </div>
  );
}
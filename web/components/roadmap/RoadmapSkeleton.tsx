// Skeleton for the Roadmap timeline — shown while the /api/roadmap request is
// in-flight after a skill has been picked. Mirrors the shape of the real
// timeline so the layout doesn't jump when data lands.

import { Card } from '@/components/ui/Card';

export function RoadmapSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      {/* Header card */}
      <Card className="overflow-hidden">
        <div className="px-5 sm:px-6 py-5 sm:py-6 space-y-3 bg-gradient-to-br from-slate-100 to-slate-200">
          <div className="h-3 w-20 bg-slate-300/70 rounded animate-pulse" />
          <div className="h-7 w-48 bg-slate-300/70 rounded animate-pulse" />
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="h-14 bg-white/40 rounded-lg animate-pulse" />
            <div className="h-14 bg-white/40 rounded-lg animate-pulse" />
          </div>
        </div>
      </Card>

      {/* 4 step rows */}
      <div className="space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-200 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-3 w-24 bg-slate-200 rounded animate-pulse" />
              <div className="h-4 w-40 bg-slate-200 rounded animate-pulse" />
              <div className="h-12 w-full bg-slate-100 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
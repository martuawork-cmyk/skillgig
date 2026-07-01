'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, ShieldCheck } from 'lucide-react';

/**
 * Auto breadcrumb for the admin workspace, derived from the current pathname.
 * No props — drop it into the header and it resolves /admin/gigs/123 into
 * "Admin › Gigs › Detail" with correct links + a non-link trailing crumb.
 */

const LABELS: Record<string, string> = {
  gigs: 'Gigs',
  courses: 'Kursus',
  subscribers: 'Subscribers',
  export: 'Export',
  create: 'Tambah',
};

// Collection parents whose non-word child segment is an id, not a route name.
const COLLECTION_PARENTS = ['gigs', 'courses', 'subscribers'];

function labelFor(segment: string, parent?: string): string {
  if (LABELS[segment]) return LABELS[segment];
  if (parent && COLLECTION_PARENTS.includes(parent)) return 'Detail';
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

export function Breadcrumb() {
  const pathname = usePathname() ?? '/';
  const segments = pathname.split('/').filter(Boolean);

  // Only render under /admin — this component lives in the admin header, so a
  // mismatch would indicate a routing mistake rather than a real state.
  if (segments[0] !== 'admin') return null;

  // The leading "admin" segment is represented by the root crumb (Admin home).
  const trail = segments.slice(1);

  let href = '/admin';
  const crumbs = trail.map((seg, i) => {
    href += `/${seg}`;
    return { href, label: labelFor(seg, trail[i - 1]) };
  });

  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
      <Link
        href="/admin"
        className="flex shrink-0 items-center gap-1.5 font-semibold text-slate-500 transition hover:text-indigo-600"
      >
        <ShieldCheck className="h-4 w-4" aria-hidden />
        <span>Admin</span>
      </Link>
      {crumbs.map((c, i) => {
        const last = i === crumbs.length - 1;
        return (
          <span key={c.href} className="flex min-w-0 items-center gap-1.5">
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" aria-hidden />
            {last ? (
              <span className="truncate font-semibold text-slate-900">{c.label}</span>
            ) : (
              <Link
                href={c.href}
                className="truncate font-medium text-slate-500 transition hover:text-indigo-600"
              >
                {c.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

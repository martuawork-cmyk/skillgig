// Presentational company logo used across the /jobs board (cards + detail).
// Kept free of hooks / 'use client' so it renders identically inside both
// server components (the detail page) and client components (JobCard).

type Props = {
  /** Emoji (legacy/seed gigs) OR a remote logo URL (synced Remotive gigs). */
  logo?: string | null;
  name?: string | null;
  size?: 'sm' | 'lg';
  className?: string;
};

export function CompanyLogo({ logo, name, size = 'sm', className }: Props) {
  const dim =
    size === 'lg' ? 'h-12 w-12 text-2xl' : 'h-10 w-10 text-xl';
  const px = size === 'lg' ? 48 : 40;
  const initials = (name ?? '?').slice(0, 2).toUpperCase();

  // Remote logo URL → render the image (Remotive sends https://… logos).
  if (logo && logo.startsWith('http')) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo}
        alt=""
        width={px}
        height={px}
        className={`${dim} rounded-xl object-contain bg-slate-50 border border-slate-100 shrink-0 ${className ?? ''}`}
      />
    );
  }

  // Emoji logo → render inside a tinted tile.
  if (logo) {
    return (
      <span
        aria-hidden
        className={`${dim} rounded-xl bg-slate-50 border border-slate-100 grid place-items-center shrink-0 ${className ?? ''}`}
      >
        {logo}
      </span>
    );
  }

  // No logo at all → gradient tile with the company initials.
  return (
    <span
      aria-hidden
      className={`${dim} rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white grid place-items-center text-sm font-bold shrink-0 ${className ?? ''}`}
    >
      {initials}
    </span>
  );
}

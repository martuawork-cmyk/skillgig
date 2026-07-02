'use client';

import { useState } from 'react';

// Presentational company logo used across the /jobs + /gigs boards (cards +
// detail). It handles three sources, in priority order:
//   1. Remote logo URL (synced Remotive gigs, `https://…`) → render the image.
//      If the image fails to load (dead CDN link, wrong format, etc.) we fall
//      back to a coloured initials tile so the card never shows a broken img.
//   2. Emoji (legacy / seed gigs) → render inside a tinted tile.
//   3. No logo at all → gradient tile with the company initials.
//
// Marked 'use client' solely for the <img onError> fallback; it still renders
// identically during SSR (error state starts false), so it composes fine
// inside both server and client components.

type Props = {
  /** Emoji (legacy/seed gigs) OR a remote logo URL (synced Remotive gigs). */
  logo?: string | null;
  name?: string | null;
  size?: 'sm' | 'lg';
  className?: string;
};

export function CompanyLogo({ logo, name, size = 'sm', className }: Props) {
  const box = size === 'lg' ? 'h-12 w-12' : 'h-10 w-10';
  const emojiSize = size === 'lg' ? 'text-2xl' : 'text-xl';
  const initials = (name ?? '?').slice(0, 2).toUpperCase();

  // Remote logo URL → render the image with an onError fallback to initials.
  if (logo && logo.startsWith('http')) {
    return (
      <LogoImage src={logo} initials={initials} box={box} className={className} />
    );
  }

  // Emoji logo → render inside a tinted tile.
  if (logo) {
    return (
      <span
        aria-hidden
        className={`${box} ${emojiSize} rounded-xl bg-slate-50 border border-slate-100 grid place-items-center shrink-0 ${className ?? ''}`}
      >
        {logo}
      </span>
    );
  }

  // No logo at all → gradient tile with the company initials.
  return (
    <span
      aria-hidden
      className={`${box} rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white grid place-items-center text-sm font-bold shrink-0 ${className ?? ''}`}
    >
      {initials}
    </span>
  );
}

/** <img> with a graceful onError → coloured initials fallback. */
function LogoImage({
  src,
  initials,
  box,
  className,
}: {
  src: string;
  initials: string;
  box: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    // Image failed to load — show the company initials on a tinted tile so the
    // card never renders a broken-image icon.
    return (
      <span
        aria-hidden
        className={`${box} rounded-xl bg-indigo-100 text-indigo-700 grid place-items-center text-sm font-bold shrink-0 ${className ?? ''}`}
      >
        {initials}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      onError={() => setFailed(true)}
      className={`${box} rounded-xl object-contain bg-slate-50 border border-slate-100 shrink-0 ${className ?? ''}`}
    />
  );
}

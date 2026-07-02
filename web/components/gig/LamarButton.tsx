'use client';

import { cn, isUrlUnavailable } from '@/lib/utils';
import { UrlUnavailableBadge } from '@/components/ui/UrlUnavailableBadge';

/**
 * "Lamar" CTA for real, externally-hosted job postings. Opens the gig's
 * listing URL in a new tab via window.open — these are real roles on Upwork /
 * LinkedIn / Kalibrr etc., so applying means leaving SkillGig.id, not routing
 * to an internal page.
 *
 * If the gig's URL is a fake/placeholder (seed row), the button is disabled
 * and a "URL tidak tersedia" badge explains why.
 *
 * Client component on purpose: window.open only exists in the browser.
 */
export function LamarButton({
  url,
  label = 'Lamar Sekarang',
  className,
}: {
  url: string;
  label?: string;
  className?: string;
}) {
  const urlBad = isUrlUnavailable(url);

  const handleClick = () => {
    if (urlBad) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-2">
      {urlBad && <UrlUnavailableBadge />}
      <button
        type="button"
        onClick={handleClick}
        disabled={urlBad}
        aria-disabled={urlBad}
        className={cn(
          'inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-bold rounded-lg transition active:scale-[.98]',
          'bg-indigo-600 text-white hover:bg-indigo-700',
          urlBad && 'opacity-50 cursor-not-allowed',
          className,
        )}
      >
        {label}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M7 17L17 7M17 7H8M17 7v9" />
        </svg>
      </button>
    </div>
  );
}

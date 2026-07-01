import { cn } from '@/lib/utils';

/**
 * SkillGig brand mark — a vector "briefcase + person reaching for a star".
 *
 * The briefcase + figure are drawn as an even-odd compound path in
 * `currentColor`: the person (head + shoulders) is a *knockout* (a hole), so
 * it automatically shows whatever sits behind the logo. That means the SAME
 * mark reads correctly on light backgrounds (set the parent text color to
 * navy) AND on dark ones (white) — the star is always gold on top.
 *
 * Inline SVG (no network request) → crisp at every size, <1 KB, zero CLS.
 * Path data is kept identical to /public/logo-mark.svg and /app/icon.svg so
 * the favicon, manifest icon and in-page logo always match exactly.
 */

export const BRAND_NAVY = '#17255A';
export const BRAND_GOLD = '#F4B400';

const HANDLE_D = 'M19 17.5v-3a5 5 0 0 1 10 0v3';
const BODY_D =
  'M6 23a6 6 0 0 1 6-6H36a6 6 0 0 1 6 6V36a6 6 0 0 1-6 6H12a6 6 0 0 1-6-6Z';
const FIGURE_D =
  'M24 28m-3.3 0a3.3 3.3 0 1 0 6.6 0a3.3 3.3 0 1 0-6.6 0M19.5 42c0-3.2 2-5 4.5-5 2.5 0 4.5 1.8 4.5 5Z';
const STAR_D =
  'M34 14.8l1.23 2.78 3.04.25-2.3 2 .7 2.96-2.67-1.6-2.67 1.6.7-2.96-2.3-2 3.04-.25Z';

export function BrandMark({
  className,
  style,
  title,
}: {
  className?: string;
  style?: React.CSSProperties;
  /** When provided, the mark is exposed to AT as a labelled image. Omit for
   *  decorative use (the surrounding wordmark/Link already names the brand). */
  title?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={className}
      style={style}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {/* handle */}
      <path
        d={HANDLE_D}
        fill="none"
        stroke="currentColor"
        strokeWidth={3.4}
        strokeLinecap="round"
      />
      {/* briefcase body with the person knocked out (even-odd) */}
      <path
        d={`${BODY_D} ${FIGURE_D}`}
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
      {/* achievement star */}
      <path d={STAR_D} fill={BRAND_GOLD} />
    </svg>
  );
}

const SIZES = {
  sm: { box: 26, name: 'text-sm', tag: 'text-[9px]' },
  md: { box: 34, name: 'text-base', tag: 'text-[10px]' },
  lg: { box: 40, name: 'text-lg', tag: 'text-[11px]' },
} as const;

export function Logo({
  size = 'md',
  /** 'dark' = for light backgrounds (navy mark/text); 'light' = for dark backgrounds (white). */
  tone = 'dark',
  showWordmark = true,
  tagline,
  className,
}: {
  size?: keyof typeof SIZES;
  tone?: 'dark' | 'light';
  showWordmark?: boolean;
  tagline?: string;
  className?: string;
}) {
  const s = SIZES[size];
  const markColor = tone === 'light' ? 'text-white' : 'text-[#17255A]';
  const nameColor = tone === 'light' ? 'text-white' : 'text-[#17255A]';
  const tagColor = tone === 'light' ? 'text-slate-300' : 'text-slate-500';

  return (
    <span className={cn('inline-flex items-center gap-2 leading-none', className)}>
      <BrandMark
        className={cn('shrink-0', markColor)}
        style={{ width: s.box, height: s.box }}
      />
      {showWordmark && (
        <span className="flex flex-col leading-tight">
          <span className={cn('font-extrabold tracking-tight', s.name, nameColor)}>
            skill<span style={{ color: BRAND_GOLD }}>gig</span>.id
          </span>
          {tagline ? (
            <span className={cn('-mt-0.5 hidden font-medium sm:block', s.tag, tagColor)}>
              {tagline}
            </span>
          ) : null}
        </span>
      )}
    </span>
  );
}

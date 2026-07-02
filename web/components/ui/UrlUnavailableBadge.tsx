import { Badge } from '@/components/ui/Badge';

/**
 * "URL tidak tersedia" — shown on gig / course cards whose outbound link is a
 * fake / placeholder (see `isUrlUnavailable`). Paired with a disabled CTA so
 * the badge always explains *why* the button is greyed out.
 */
export function UrlUnavailableBadge({ className }: { className?: string }) {
  return (
    <Badge tone="amber" className={className}>
      <span aria-hidden>⚠️</span> URL tidak tersedia
    </Badge>
  );
}

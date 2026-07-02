'use client';

import posthog from 'posthog-js';

// =============================================================================
// SkillGig.id — PostHog event capture.
// -----------------------------------------------------------------------------
// PostHogProvider (components/analytics/PostHogProvider) initialises the shared
// `posthog` singleton on the client when NEXT_PUBLIC_POSTHOG_KEY is set. `track`
// talks to that same singleton, so it works from any client component's event
// handler without threading React context. It is a deliberate no-op when:
//   - running on the server (typeof window === 'undefined'), or
//   - PostHog isn't configured (no key) — local dev / CI stay quiet.
//
// Event names are centralised so tracking stays consistent across cards.
// =============================================================================

export const AnalyticsEvent = {
  /** "Lamar" — opens the external listing. */
  GigApplyClicked: 'gig_apply_clicked',
  /** "Mulai Belajar" — starts an outbound course/affiliate click. */
  CourseStartClicked: 'course_start_clicked',
  /** "Simpan" — user saved a job/gig to their list. */
  JobSaved: 'job_saved',
} as const;

/**
 * Fire a PostHog event with optional properties. Safe to call anywhere on the
 * client; never throws. Returns true when captured, false when skipped.
 */
export function track(
  event: string,
  properties?: Record<string, unknown>,
): boolean {
  if (typeof window === 'undefined') return false;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return false;
  try {
    posthog.capture(event, properties);
    return true;
  } catch {
    // Analytics must never break the UI — swallow capture errors silently.
    return false;
  }
}

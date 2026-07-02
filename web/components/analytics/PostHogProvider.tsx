'use client';

import type { ReactNode } from 'react';
import { PostHogProvider } from 'posthog-js/react';

// =============================================================================
// Conditional PostHog provider for the App Router.
// -----------------------------------------------------------------------------
// Mounted at the root layout. When NEXT_PUBLIC_POSTHOG_KEY is absent (local
// dev, CI) this renders children untouched — `track()` then no-ops everywhere,
// so the app behaves identically without a PostHog project. The key is inlined
// at build time and therefore identical on server and client, so the
// conditional introduces no hydration mismatch. `autocapture: false` keeps
// PostHog to our explicit events only (no full DOM autocapture).
// =============================================================================

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  if (!POSTHOG_KEY) return <>{children}</>;
  return (
    <PostHogProvider
      apiKey={POSTHOG_KEY}
      options={{ api_host: POSTHOG_HOST, autocapture: false }}
    >
      {children}
    </PostHogProvider>
  );
}

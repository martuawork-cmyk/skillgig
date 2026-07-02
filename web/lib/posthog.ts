import posthog from 'posthog-js';

export function initPostHog() {
  if (typeof window !== 'undefined') {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
      // Mengaktifkan pelacakan otomatis yang kamu butuhkan
      capture_pageleave: true, 
      capture_performance: true, // Untuk $web_vitals
      person_profiles: 'identified_only',
    });
  }
}
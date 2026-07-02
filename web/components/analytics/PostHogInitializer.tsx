'use client';

import { useEffect } from 'react';
import { initPostHog } from '@/lib/posthog';

export function PostHogInitializer() {
  useEffect(() => {
    initPostHog();
  }, []);

  return null; // Komponen ini hanya untuk trigger side-effect
}
import type { MetadataRoute } from 'next';

/**
 * Web App Manifest — Next.js serves this at /manifest.webmanifest and injects
 * `<link rel="manifest">` automatically. Enables "Add to Home Screen", an app
 * icon, and the brand navy in the mobile browser UI (theme-color).
 *
 * Icon: a single SVG declared as `sizes: "any"` — modern Chrome/Edge/Firefox
 * accept SVG-only manifest icons for installability, so we keep one crisp,
 * tiny asset instead of shipping multiple raster sizes.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SkillGig.id — Belajar Skill Digital & Cari Freelance',
    short_name: 'SkillGig',
    description:
      'Platform Indonesia untuk belajar skill digital, membangun portofolio, dan menemukan peluang freelance.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#17255A',
    icons: [
      {
        src: '/logo-mark.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}

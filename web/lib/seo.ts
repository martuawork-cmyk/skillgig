import type { Metadata } from 'next';

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://skillgig.id';
export const SITE_NAME = 'SkillGig.id';

const DEFAULT_DESCRIPTION =
  'SkillGig.id menghubungkan perjalanan belajar skill digital, membangun portofolio, menemukan gig, melamar, dan menghasilkan — semuanya untuk freelancer Indonesia.';

const DEFAULT_OG_IMAGE = `${SITE_URL}/opengraph-image`;
const DEFAULT_TWITTER_IMAGE = `${SITE_URL}/twitter-image`;

/**
 * Build a Next.js `Metadata` object with full SEO + social coverage.
 *
 * Each page passes its own title/description. We layer in:
 *   - canonical URL (via `alternates.canonical`)
 *   - OpenGraph title/description/image/url
 *   - Twitter card title/description/image
 *
 * `metadataBase` lives on the root layout so absolute URLs (images,
 * alternates) resolve correctly.
 */
export function buildMetadata(opts: {
  /** Final document title. Becomes both `<title>` and og:title. */
  title: string;
  /** Used for description, og:description, twitter:description. */
  description?: string;
  /** Path under the site root, e.g. '/gigs'. Used for canonical + og:url. */
  path: string;
  /** og:image override (absolute URL). Defaults to the default OG image. */
  image?: string;
  /** Twitter card variant. Defaults to 'summary_large_image'. */
  twitterCard?: 'summary' | 'summary_large_image';
}): Metadata {
  const description = opts.description ?? DEFAULT_DESCRIPTION;
  const path = opts.path.startsWith('/') ? opts.path : `/${opts.path}`;
  const url = `${SITE_URL}${path}`;
  const image = opts.image ?? DEFAULT_OG_IMAGE;
  const twitterImage = image === DEFAULT_OG_IMAGE ? DEFAULT_TWITTER_IMAGE : image;

  return {
    title: opts.title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'website',
      url,
      siteName: SITE_NAME,
      title: opts.title,
      description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: opts.title,
        },
      ],
      locale: 'id_ID',
    },
    twitter: {
      card: opts.twitterCard ?? 'summary_large_image',
      title: opts.title,
      description,
      images: [twitterImage],
    },
  };
}

/**
 * Convenience for the root layout: returns the default metadata that other
 * pages inherit from. `metadataBase` and `title.template` belong here so
 * children can pass short titles via buildMetadata().
 */
export function getSiteMetadata(): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: 'SkillGig.id — Belajar Skill Digital & Cari Freelance Indonesia',
      template: '%s | SkillGig.id',
    },
    description: DEFAULT_DESCRIPTION,
    applicationName: SITE_NAME,
    keywords: [
      'freelance Indonesia',
      'belajar skill digital',
      'lowongan freelance',
      'kursus online',
      'platform freelance',
      'SkillGig',
    ],
    authors: [{ name: SITE_NAME }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    alternates: {
      canonical: SITE_URL,
    },
    openGraph: {
      type: 'website',
      url: SITE_URL,
      siteName: SITE_NAME,
      title: 'SkillGig.id — Belajar Skill Digital & Cari Freelance Indonesia',
      description: DEFAULT_DESCRIPTION,
      locale: 'id_ID',
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: 'SkillGig.id — Belajar skill digital & cari freelance di Indonesia',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'SkillGig.id — Belajar Skill Digital & Cari Freelance Indonesia',
      description: DEFAULT_DESCRIPTION,
      images: [DEFAULT_TWITTER_IMAGE],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons: {
      icon: '/favicon.ico',
    },
  };
}
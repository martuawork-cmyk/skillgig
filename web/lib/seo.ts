import type { Metadata } from 'next';
import type { Gig, GigJobType } from './types';

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://skillgig.id';
export const SITE_NAME = 'SkillGig.id';

const DEFAULT_DESCRIPTION =
  'SkillGig.id menghubungkan perjalanan belajar skill digital, membangun portofolio, menemukan gig, melamar, dan menghasilkan — semuanya untuk freelancer Indonesia.';

// A single 1200×630 brand image serves both OpenGraph and Twitter previews.
// Served as a static, long-cached asset (see vercel.json) — no per-build render.
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;
const DEFAULT_TWITTER_IMAGE = `${SITE_URL}/og-image.png`;

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
      // RSS auto-discovery: feed readers + automation tools find the job feed.
      types: {
        'application/rss+xml': `${SITE_URL}/rss.xml`,
      },
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
    // Icons are provided via App Router file conventions (app/icon.svg,
    // app/icon.png, app/apple-icon.png, app/favicon.ico) — Next.js injects the
    // matching <link> tags automatically, so we don't duplicate them here.
  };
}

// ===========================================================================
// JobPosting structured data (schema.org) — the Google Jobs enabler.
// ---------------------------------------------------------------------------
// Rendered as a <script type="application/ld+json"> on each /jobs/[id] page.
// A valid JobPosting makes the listing eligible for the Google Jobs rich
// result (the "jobs" box at the top of search) — the fastest free-traffic
// lever for a remote job board. See:
// https://developers.google.com/search/docs/appearance/structured-data/job-posting
// ===========================================================================

/** schema.org employmentType per Google's controlled vocabulary. */
const EMPLOYMENT_TYPE: Record<GigJobType, string> = {
  'Full-Time': 'FULL_TIME',
  'Part-Time': 'PART_TIME',
  Contract: 'CONTRACTOR',
  Freelance: 'CONTRACTOR',
  Internship: 'INTERN',
};

/**
 * Build the JobPosting JSON-LD object for a synced remote job.
 *
 * These are remote roles curated as open to Indonesian applicants, so we emit
 * `jobLocationType: TELECOMMUTE` + `applicantLocationRequirements: Indonesia`
 * (Google's required shape for remote postings). `baseSalary` is emitted in the
 * job's SOURCE currency (USD/GBP/IDR) — the honest upstream figure, annual — and
 * only when a real number is present. `validThrough` defaults to 60 days after
 * posting so stale listings drop out of the rich result on their own.
 */
export function jobPostingJsonLd(gig: Gig): Record<string, unknown> {
  const posted = gig.postedAt ? new Date(gig.postedAt) : new Date();
  const validThrough = new Date(posted.getTime() + 60 * 24 * 60 * 60 * 1000);
  const company = gig.company || gig.platform;
  const min = gig.salaryMin ?? gig.budgetMin ?? 0;
  const max = gig.salaryMax ?? gig.budgetMax ?? 0;
  const currency = (gig.salaryCurrency ?? 'IDR').toUpperCase();

  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org/',
    '@type': 'JobPosting',
    title: gig.titleId || gig.title,
    description:
      gig.descriptionId && gig.descriptionId.length > 0
        ? gig.descriptionId
        : `Lowongan kerja remote: ${gig.titleId || gig.title}`,
    datePosted: posted.toISOString(),
    validThrough: validThrough.toISOString(),
    employmentType: gig.jobType ? EMPLOYMENT_TYPE[gig.jobType] : 'FULL_TIME',
    hiringOrganization: {
      '@type': 'Organization',
      name: company,
      ...(gig.company_logo ? { logo: gig.company_logo } : {}),
    },
    // Remote posting shape (Google requirement for telecommute roles).
    jobLocationType: 'TELECOMMUTE',
    applicantLocationRequirements: {
      '@type': 'Country',
      name: 'Indonesia',
    },
    directApply: false,
    url: `${SITE_URL}/jobs/${gig.id}`,
    identifier: {
      '@type': 'PropertyValue',
      name: gig.platform,
      value: gig.sourceId || gig.id,
    },
  };

  // Only emit baseSalary when we actually have a figure (Google warns on 0/0).
  if (max > 0 || min > 0) {
    const lo = Math.min(min || max, max || min);
    const hi = Math.max(min, max);
    ld.baseSalary = {
      '@type': 'MonetaryAmount',
      currency,
      value: {
        '@type': 'QuantitativeValue',
        ...(lo === hi ? { value: hi } : { minValue: lo, maxValue: hi }),
        unitText: 'YEAR',
      },
    };
  }

  return ld;
}

/** schema.org BreadcrumbList JSON-LD from a list of {name, path} crumbs. */
export function breadcrumbJsonLd(
  items: { name: string; path: string }[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.path}`,
    })),
  };
}

/** schema.org ItemList JSON-LD linking each job on a category listing page. */
export function jobItemListJsonLd(
  jobs: { id: string; title: string }[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: jobs.map((j, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/jobs/${j.id}`,
      name: j.title,
    })),
  };
}
import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { SiteChrome } from '@/components/layout/SiteChrome';
import { SavedHydrator } from '@/components/system/SavedHydrator';
import { getCurrentUser } from '@/lib/supabase/session';
import { getSiteMetadata, SITE_URL } from '@/lib/seo';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

// Plus Jakarta Sans is the admin workspace typeface. We expose it as a CSS
// variable here (available to every route) and the admin shell opts into it via
// `var(--font-jakarta)` — public pages keep Inter, so this does not change the
// look of the marketing site.
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
});

// Default SEO + social metadata for the whole site. Per-page metadata built
// via `buildMetadata()` in lib/seo.ts overrides these.
export const metadata: Metadata = getSiteMetadata();

export const viewport: Viewport = {
  themeColor: '#17255A',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch current user in the root layout so the header can render the
  // appropriate auth state (sign-in button vs user menu) on every page.
  // If Supabase isn't configured or session is missing, this resolves to null.
  const user = await getCurrentUser();
  const headerUser = user
    ? {
        id: user.id,
        name: user.name,
        initials: user.initials,
        role: user.role,
      }
    : null;

  return (
    <html lang="id" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {/* Organization structured data — gives search engines the official
            brand name + logo (Google prefers a raster logo for this field). */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'SkillGig.id',
              url: SITE_URL,
              logo: `${SITE_URL}/logo.png`,
            }),
          }}
        />
        <SiteChrome user={headerUser}>{children}</SiteChrome>
        <SavedHydrator />
      </body>
    </html>
  );
}
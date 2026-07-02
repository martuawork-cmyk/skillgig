import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { SiteChrome } from '@/components/layout/SiteChrome';
import { AnalyticsProvider } from '@/components/analytics/PostHogProvider';
import { SavedHydrator } from '@/components/system/SavedHydrator';
import { getCurrentUser } from '@/lib/supabase/session';
import { getSiteMetadata, SITE_URL } from '@/lib/seo';
import { PostHogInitializer } from '@/components/analytics/PostHogInitializer'; // Komponen wrapper baru

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
});

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
  const user = await getCurrentUser();
  const headerUser = user
    ? { id: user.id, name: user.name, initials: user.initials, role: user.role }
    : null;

  return (
    <html lang="id" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
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
        <AnalyticsProvider>
          {/* Tambahkan initializer ini agar initPostHog berjalan di client */}
          <PostHogInitializer />
          <SiteChrome user={headerUser}>{children}</SiteChrome>
          <SavedHydrator />
        </AnalyticsProvider>
      </body>
    </html>
  );
}
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { JourneyNav } from '@/components/layout/JourneyNav';
import { Footer } from '@/components/layout/Footer';
import { SavedHydrator } from '@/components/system/SavedHydrator';
import { getCurrentUser } from '@/lib/supabase/session';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'SkillGig.id — Learn, Build Skill, Discover Gig, Apply, Earn',
  description:
    'Platform Indonesia yang menghubungkan pembelajaran skill digital dengan peluang freelance.',
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
    <html lang="id" className={inter.variable}>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <Header user={headerUser} />
        <JourneyNav />
        <main>{children}</main>
        <Footer />
        <SavedHydrator />
      </body>
    </html>
  );
}
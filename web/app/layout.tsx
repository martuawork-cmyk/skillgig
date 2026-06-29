import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { JourneyNav } from '@/components/layout/JourneyNav';
import { Footer } from '@/components/layout/Footer';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'SkillGig.id — Learn, Build Skill, Discover Gig, Apply, Earn',
  description:
    'Platform Indonesia yang menghubungkan pembelajaran skill digital dengan peluang freelance.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <Header />
        <JourneyNav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
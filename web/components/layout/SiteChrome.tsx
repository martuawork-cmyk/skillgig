'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

type HeaderUser = {
  id: string;
  name: string;
  initials: string;
  role: 'client' | 'freelancer';
  email?: string;
} | null;

type Props = {
  user: HeaderUser;
  children: ReactNode;
};

/**
 * Decides which site chrome (Header / Footer) wraps a page.
 *
 * The root layout renders this around every route so that marketing pages keep
 * their top navigation, while the admin workspace — a focused area with its own
 * fixed sidebar and header — renders bare. Admin is its own world: no
 * "Learn · Earn · Roadmap" nav, no marketing footer. Checking `usePathname()`
 * here keeps that decision in one place instead of sprinkling guards across
 * Header/Footer.
 *
 * The journey progress stepper (Learn → Build → Discover → Apply → Earn) used
 * to live here as a global sub-bar; it has moved to the dedicated /dashboard
 * page so the main header stays clean and the journey is tracked where it
 * belongs — on the user's personal dashboard.
 *
 * `usePathname()` resolves during SSR in the App Router, so there is no flash
 * of the public chrome before admin mounts.
 */
export function SiteChrome({ user, children }: Props) {
  const pathname = usePathname() ?? '/';
  const isAdmin = pathname.startsWith('/admin');

  if (isAdmin) {
    // Admin renders its own shell (see app/(admin)/layout.tsx).
    return <>{children}</>;
  }

  return (
    <>
      <Header user={user} />
      <main>{children}</main>
      <Footer />
    </>
  );
}

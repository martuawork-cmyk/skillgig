import { adminListGigs } from '@/lib/supabase/admin-queries';
import { GigsConsole } from './GigsConsole';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Kelola Gigs — Admin SkillGig.id',
};

/**
 * Admin gigs workspace. The server page only fetches the full gig list and
 * hands it to the client `GigsConsole`, which owns tabs, search, filters,
 * pagination, and the add/edit form. create/update/delete actions all
 * revalidate `/admin/gigs`, so Next re-renders this page and passes fresh
 * props to the console after every mutation.
 */
export default async function AdminGigsPage() {
  const gigs = await adminListGigs();
  return <GigsConsole gigs={gigs} />;
}

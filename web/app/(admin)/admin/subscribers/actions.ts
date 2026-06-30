'use server';

import { revalidatePath } from 'next/cache';
import { adminDeleteSubscriber } from '@/lib/supabase/admin-queries';

export async function deleteSubscriberAction(id: string): Promise<void> {
  await adminDeleteSubscriber(id);
  revalidatePath('/admin');
  revalidatePath('/admin/subscribers');
}

'use server';

import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

export async function signOut(formData: FormData): Promise<void> {
  const locale = formData.get('locale') === 'en' ? 'en' : 'fr';
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${locale}`);
}

'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';

export type AuthActionState = { error: string | null };

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(6).max(128),
  locale: z.enum(['fr', 'en']),
  intent: z.enum(['login', 'signup']),
});

export async function authenticate(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = credentialsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: 'Vérifiez votre email et votre mot de passe.' };

  const supabase = await createClient();
  const { email, password, locale, intent } = parsed.data;
  const result =
    intent === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
  if (result.error) return { error: result.error.message };
  redirect(`/${locale}/dashboard`);
}

export async function signInWithGoogle(formData: FormData): Promise<void> {
  const locale = formData.get('locale') === 'en' ? 'en' : 'fr';
  const origin = (await headers()).get('origin');
  if (!origin) return;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${origin}/auth/callback?next=/${locale}/dashboard` },
  });
  if (!error && data.url) redirect(data.url);
}

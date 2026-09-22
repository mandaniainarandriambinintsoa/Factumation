import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { AppShell } from '@/components/app-shell';
import { createClient } from '@/lib/supabase/server';

export default async function ProtectedLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect(`/${locale}/login`);
  const email = typeof data.claims.email === 'string' ? data.claims.email : null;
  return (
    <AppShell locale={locale} email={email}>
      {children}
    </AppShell>
  );
}

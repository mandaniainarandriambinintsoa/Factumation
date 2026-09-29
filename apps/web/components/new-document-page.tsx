import { AppShell } from './app-shell';
import { DocumentForm } from './document-form';
import { GuestDocumentForm } from './guest-document-form';
import { PublicShell } from './public-shell';
import { apiRequest } from '@/lib/api/server-api';
import type { Client, Company, Paginated } from '@/lib/api/types';
import { createClient } from '@/lib/supabase/server';

export async function NewDocumentPage({
  locale,
  kind,
}: {
  locale: string;
  kind: 'invoice' | 'quote';
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    return (
      <PublicShell locale={locale === 'en' ? 'en' : 'fr'} active={kind}>
        <GuestDocumentForm key={kind} locale={locale} kind={kind} />
      </PublicShell>
    );
  }
  // Account data is only loaded after the session has been verified.
  const [companies, clients] = await Promise.all([
    apiRequest<Paginated<Company>>('/companies?limit=100'),
    apiRequest<Paginated<Client>>('/clients?limit=100'),
  ]);
  const email = typeof data.claims.email === 'string' ? data.claims.email : null;
  return (
    <AppShell locale={locale} email={email}>
      <DocumentForm
        locale={locale}
        kind={kind}
        companies={companies.items}
        clients={clients.items}
      />
    </AppShell>
  );
}

import { NextResponse } from 'next/server';

import { getSiteUrl } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next');
  const destination = next?.startsWith('/') && !next.startsWith('//') ? next : '/fr/dashboard';
  const siteUrl = getSiteUrl();
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(destination, siteUrl));
  }
  return NextResponse.redirect(new URL('/fr/login?error=oauth', siteUrl));
}

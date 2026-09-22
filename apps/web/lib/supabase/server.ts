import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { getPublicEnvironment } from '../env';

export async function createClient() {
  const cookieStore = await cookies();
  const environment = getPublicEnvironment();
  return createServerClient(environment.supabaseUrl, environment.supabasePublishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot write cookies; proxy.ts owns token refresh.
        }
      },
    },
  });
}

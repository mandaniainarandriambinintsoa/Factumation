import { createBrowserClient } from '@supabase/ssr';

import { getPublicEnvironment } from '../env';

export function createClient() {
  const environment = getPublicEnvironment();
  return createBrowserClient(environment.supabaseUrl, environment.supabasePublishableKey);
}

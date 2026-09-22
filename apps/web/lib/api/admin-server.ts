import 'server-only';

import { getPublicEnvironment } from '../env';
import { createClient } from '../supabase/server';

export async function adminRequest<T>(
  action: string,
  options: {
    query?: Record<string, string>;
    method?: 'GET' | 'POST';
    body?: unknown;
  } = {},
): Promise<T> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (claims?.claims?.email !== 'mandaniaina.randriambinintsoa@gmail.com')
    throw new Error('Forbidden');
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Authentication required');
  const parameters = new URLSearchParams({ action, ...options.query });
  const response = await fetch(
    `${getPublicEnvironment().supabaseUrl}/functions/v1/admin?${parameters}`,
    {
      method: options.method ?? 'GET',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: getPublicEnvironment().supabasePublishableKey,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    },
  );
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? 'Admin service unavailable');
  }
  return response.json() as Promise<T>;
}

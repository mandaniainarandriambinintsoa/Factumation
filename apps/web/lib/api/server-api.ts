import 'server-only';

import { getPublicEnvironment } from '../env';
import { createClient } from '../supabase/server';

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly requestId: string | null,
    message: string,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims)
    throw new ApiRequestError(401, null, 'Authentication required.');
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) throw new ApiRequestError(401, null, 'Authentication required.');

  const response = await fetch(`${getPublicEnvironment().apiUrl}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new ApiRequestError(
      response.status,
      response.headers.get('x-request-id'),
      body?.detail ?? 'The API request failed.',
    );
  }
  return (await response.json()) as T;
}

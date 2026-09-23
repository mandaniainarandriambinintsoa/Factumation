'use client';

import { getPublicEnvironment } from '../env';
import { createClient } from '../supabase/client';

export class BrowserApiError extends Error {
  constructor(
    readonly status: number,
    readonly requestId: string | null,
    message: string,
  ) {
    super(message);
    this.name = 'BrowserApiError';
  }
}

export async function browserApiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new BrowserApiError(401, null, 'Votre session a expiré. Reconnectez-vous.');
  const response = await fetch(`${getPublicEnvironment().apiUrl}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      detail?: string;
      message?: string;
    } | null;
    throw new BrowserApiError(
      response.status,
      response.headers.get('x-request-id'),
      body?.detail ?? body?.message ?? 'La requête a échoué.',
    );
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function browserApiFormRequest<T>(path: string, form: FormData): Promise<T> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new BrowserApiError(401, null, 'Votre session a expiré. Reconnectez-vous.');
  const response = await fetch(`${getPublicEnvironment().apiUrl}${path}`, {
    method: 'POST',
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      detail?: string;
      message?: string;
    } | null;
    throw new BrowserApiError(
      response.status,
      response.headers.get('x-request-id'),
      body?.detail ?? body?.message ?? 'L’analyse a échoué.',
    );
  }
  return (await response.json()) as T;
}

export async function browserApiDownload(path: string): Promise<Blob> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new BrowserApiError(401, null, 'Votre session a expiré. Reconnectez-vous.');
  const response = await fetch(`${getPublicEnvironment().apiUrl}${path}`, {
    cache: 'no-store',
    headers: { Accept: 'application/pdf', Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new BrowserApiError(
      response.status,
      response.headers.get('x-request-id'),
      body?.detail ?? 'Le PDF n’a pas pu être généré.',
    );
  }
  return response.blob();
}

import { supabase } from '../lib/supabase';

const ADMIN_EMAIL = 'mandaniaina.randriambinintsoa@gmail.com';

export interface AdminStats {
  totalUsers: number;
  totalInvoices: number;
  totalQuotes: number;
  totalBlogPosts: number;
  publishedBlogPosts: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  provider: string;
  createdAt: string;
  lastSignIn: string | null;
}

export function isAdmin(email: string | undefined): boolean {
  return email === ADMIN_EMAIL;
}

async function callAdminFunction(action: string, params?: Record<string, string>): Promise<any> {
  if (!supabase) throw new Error('Supabase not configured');

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const searchParams = new URLSearchParams({ action, ...params });

  const { data, error } = await supabase.functions.invoke('admin', {
    body: null,
    headers: {},
    method: 'GET',
  });

  // Fallback: use fetch directly for GET with query params
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const response = await fetch(
    `${supabaseUrl}/functions/v1/admin?${searchParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }

  return response.json();
}

export async function getAdminStats(): Promise<AdminStats> {
  return callAdminFunction('stats');
}

export async function getUsers(page = 1, perPage = 20): Promise<{ users: AdminUser[]; total: number }> {
  return callAdminFunction('list-users', {
    page: page.toString(),
    perPage: perPage.toString(),
  });
}

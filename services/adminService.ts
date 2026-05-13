import { supabase } from '../lib/supabase';

const ADMIN_EMAIL = 'mandaniaina.randriambinintsoa@gmail.com';

export interface AdminStats {
  totalUsers: number;
  totalInvoices: number;
  totalQuotes: number;
  totalBlogPosts: number;
  publishedBlogPosts: number;
  paidSubscriptions?: number;
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

export type SubscriptionPlan = 'free' | 'pro' | 'business';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
export type SubscriptionSource = 'stripe' | 'manual';

export interface AdminUserWithSub extends AdminUser {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  source: SubscriptionSource;
  currentPeriodEnd: string | null;
  manualExpiresAt: string | null;
  adminNotes: string | null;
  hasStripeCustomer: boolean;
  cancelAtPeriodEnd: boolean;
}

export interface SubscriptionUpdatePayload {
  plan?: SubscriptionPlan;
  status?: SubscriptionStatus;
  manualExpiresAt?: string | null;
  adminNotes?: string | null;
}

export interface BroadcastResult {
  sent: number;
  failed: number;
  total: number;
  failures: { email: string; error: string }[];
}

export function isAdmin(email: string | undefined): boolean {
  return email === ADMIN_EMAIL;
}

async function callAdminFunction(
  action: string,
  options: {
    method?: 'GET' | 'POST';
    queryParams?: Record<string, string>;
    body?: unknown;
  } = {}
): Promise<any> {
  if (!supabase) throw new Error('Supabase not configured');

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const searchParams = new URLSearchParams({ action, ...(options.queryParams || {}) });

  const response = await fetch(
    `${supabaseUrl}/functions/v1/admin?${searchParams.toString()}`,
    {
      method: options.method || 'GET',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
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
    queryParams: { page: page.toString(), perPage: perPage.toString() },
  });
}

export async function getUsersWithSubs(
  page = 1,
  perPage = 20
): Promise<{ users: AdminUserWithSub[]; total: number }> {
  return callAdminFunction('list-users-with-subs', {
    queryParams: { page: page.toString(), perPage: perPage.toString() },
  });
}

export async function updateUserSubscription(
  userId: string,
  payload: SubscriptionUpdatePayload
): Promise<{ subscription: unknown }> {
  return callAdminFunction('update-subscription', {
    method: 'POST',
    body: { userId, ...payload },
  });
}

export async function broadcastEmail(
  userIds: string[],
  subject: string,
  html: string,
  options: { fromName?: string; replyTo?: string } = {}
): Promise<BroadcastResult> {
  return callAdminFunction('broadcast-email', {
    method: 'POST',
    body: { userIds, subject, html, ...options },
  });
}

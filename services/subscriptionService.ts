import { supabase } from '../lib/supabase';

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  plan: 'free' | 'pro' | 'business';
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export async function getUserSubscription(): Promise<Subscription | null> {
  if (!supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error || !data) return null;
  return data as Subscription;
}

export async function createCheckoutSession(plan: 'pro' | 'business'): Promise<{ url: string } | { error: string }> {
  if (!supabase) return { error: 'Supabase non configuré' };

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: 'Non authentifié' };

  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: { plan },
  });

  if (error) return { error: error.message };
  if (data?.error) return { error: data.error };
  return { url: data.url };
}

export async function createPapiCheckoutSession(plan: 'pro' | 'business'): Promise<{ url: string; reference: string } | { error: string }> {
  if (!supabase) return { error: 'Supabase non configuré' };

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: 'Non authentifié' };

  const { data, error } = await supabase.functions.invoke('create-papi-checkout', {
    body: { plan },
  });

  if (error) return { error: error.message };
  if (data?.error) return { error: data.error };
  return { url: data.url, reference: data.reference };
}

export async function createPortalSession(): Promise<{ url: string } | { error: string }> {
  if (!supabase) return { error: 'Supabase non configuré' };

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: 'Non authentifié' };

  const { data, error } = await supabase.functions.invoke('create-portal', {
    body: {},
  });

  if (error) return { error: error.message };
  if (data?.error) return { error: data.error };
  return { url: data.url };
}

export async function getMonthlyUsage(): Promise<{ invoices: number; quotes: number }> {
  if (!supabase) return { invoices: 0, quotes: 0 };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { invoices: 0, quotes: 0 };

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: invoiceCount } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', startOfMonth.toISOString());

  const { count: quoteCount } = await supabase
    .from('quotes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', startOfMonth.toISOString());

  return { invoices: invoiceCount || 0, quotes: quoteCount || 0 };
}

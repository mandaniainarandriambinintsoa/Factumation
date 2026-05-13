import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ADMIN_EMAIL = 'mandaniaina.randriambinintsoa@gmail.com';

const ALLOWED_PLANS = ['free', 'pro', 'business'] as const;
const ALLOWED_STATUSES = ['active', 'canceled', 'past_due', 'trialing', 'incomplete'] as const;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing authorization' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await anonClient.auth.getUser();

    if (authError || !user || user.email !== ADMIN_EMAIL) {
      return json({ error: 'Unauthorized' }, 403);
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // ---------- GET: list users (legacy, without subscriptions) ----------
    if (action === 'list-users' && req.method === 'GET') {
      const page = parseInt(url.searchParams.get('page') || '1');
      const perPage = parseInt(url.searchParams.get('perPage') || '20');

      const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
      if (error) throw error;

      const users = data.users.map((u: any) => ({
        id: u.id,
        email: u.email,
        name: u.user_metadata?.full_name || u.user_metadata?.name || null,
        avatarUrl: u.user_metadata?.avatar_url || u.user_metadata?.picture || null,
        provider: u.app_metadata?.provider || 'email',
        createdAt: u.created_at,
        lastSignIn: u.last_sign_in_at,
      }));

      return json({ users, total: data.users.length });
    }

    // ---------- GET: list users joined with subscriptions ----------
    if (action === 'list-users-with-subs' && req.method === 'GET') {
      const page = parseInt(url.searchParams.get('page') || '1');
      const perPage = parseInt(url.searchParams.get('perPage') || '20');

      const { data: usersData, error: usersError } = await adminClient.auth.admin.listUsers({
        page,
        perPage,
      });
      if (usersError) throw usersError;

      const userIds = usersData.users.map((u: any) => u.id);
      const { data: subs, error: subsError } = await adminClient
        .from('subscriptions')
        .select('user_id, plan, status, source, current_period_end, manual_expires_at, admin_notes, stripe_customer_id, cancel_at_period_end')
        .in('user_id', userIds);

      if (subsError) throw subsError;

      const subByUser = new Map<string, any>();
      for (const s of subs || []) subByUser.set(s.user_id, s);

      const users = usersData.users.map((u: any) => {
        const sub = subByUser.get(u.id);
        return {
          id: u.id,
          email: u.email,
          name: u.user_metadata?.full_name || u.user_metadata?.name || null,
          avatarUrl: u.user_metadata?.avatar_url || u.user_metadata?.picture || null,
          provider: u.app_metadata?.provider || 'email',
          createdAt: u.created_at,
          lastSignIn: u.last_sign_in_at,
          plan: sub?.plan || 'free',
          status: sub?.status || 'active',
          source: sub?.source || 'stripe',
          currentPeriodEnd: sub?.current_period_end || null,
          manualExpiresAt: sub?.manual_expires_at || null,
          adminNotes: sub?.admin_notes || null,
          hasStripeCustomer: !!sub?.stripe_customer_id,
          cancelAtPeriodEnd: !!sub?.cancel_at_period_end,
        };
      });

      return json({ users, total: usersData.users.length });
    }

    // ---------- POST: update subscription (manual override) ----------
    if (action === 'update-subscription' && req.method === 'POST') {
      const body = await req.json().catch(() => null);
      if (!body) return json({ error: 'Invalid JSON body' }, 400);

      const { userId, plan, status, manualExpiresAt, adminNotes } = body as {
        userId?: string;
        plan?: string;
        status?: string;
        manualExpiresAt?: string | null;
        adminNotes?: string | null;
      };

      if (!userId) return json({ error: 'userId is required' }, 400);
      if (plan && !ALLOWED_PLANS.includes(plan as any)) {
        return json({ error: `plan must be one of ${ALLOWED_PLANS.join(', ')}` }, 400);
      }
      if (status && !ALLOWED_STATUSES.includes(status as any)) {
        return json({ error: `status must be one of ${ALLOWED_STATUSES.join(', ')}` }, 400);
      }

      const updates: Record<string, unknown> = {
        source: 'manual',
        updated_at: new Date().toISOString(),
      };
      if (plan !== undefined) updates.plan = plan;
      if (status !== undefined) updates.status = status;
      if (manualExpiresAt !== undefined) updates.manual_expires_at = manualExpiresAt;
      if (adminNotes !== undefined) updates.admin_notes = adminNotes;

      // Upsert: create row if user has no subscription yet
      const { data: existing } = await adminClient
        .from('subscriptions')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      let result;
      if (existing) {
        result = await adminClient
          .from('subscriptions')
          .update(updates)
          .eq('user_id', userId)
          .select()
          .single();
      } else {
        result = await adminClient
          .from('subscriptions')
          .insert({ user_id: userId, ...updates })
          .select()
          .single();
      }

      if (result.error) throw result.error;
      return json({ subscription: result.data });
    }

    // ---------- POST: broadcast email to selected users ----------
    if (action === 'broadcast-email' && req.method === 'POST') {
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      if (!resendApiKey) return json({ error: 'RESEND_API_KEY not configured' }, 500);

      const body = await req.json().catch(() => null);
      if (!body) return json({ error: 'Invalid JSON body' }, 400);

      const { userIds, subject, html, fromName, replyTo } = body as {
        userIds?: string[];
        subject?: string;
        html?: string;
        fromName?: string;
        replyTo?: string;
      };

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return json({ error: 'userIds (non-empty array) is required' }, 400);
      }
      if (!subject?.trim()) return json({ error: 'subject is required' }, 400);
      if (!html?.trim()) return json({ error: 'html is required' }, 400);
      if (userIds.length > 500) return json({ error: 'Maximum 500 recipients per batch' }, 400);

      // Resolve email addresses (1 query per user via admin API)
      const recipients: { id: string; email: string }[] = [];
      for (const uid of userIds) {
        const { data } = await adminClient.auth.admin.getUserById(uid);
        if (data?.user?.email) recipients.push({ id: uid, email: data.user.email });
      }

      if (recipients.length === 0) {
        return json({ error: 'No valid recipients found' }, 400);
      }

      const from = `${fromName?.trim() || 'Factumation'} <onboarding@resend.dev>`;
      const sent: string[] = [];
      const failed: { email: string; error: string }[] = [];

      // Send sequentially with a small delay to stay under Resend rate limit (2 req/s on free, 10 req/s on paid)
      for (const r of recipients) {
        try {
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from,
              to: [r.email],
              ...(replyTo ? { reply_to: replyTo } : {}),
              subject,
              html,
            }),
          });
          if (res.ok) sent.push(r.email);
          else {
            const err = await res.json().catch(() => ({}));
            failed.push({ email: r.email, error: err.message || `HTTP ${res.status}` });
          }
        } catch (e) {
          failed.push({ email: r.email, error: (e as Error).message });
        }
        await new Promise((resolve) => setTimeout(resolve, 600));
      }

      return json({
        sent: sent.length,
        failed: failed.length,
        failures: failed,
        total: recipients.length,
      });
    }

    // ---------- GET: stats ----------
    if (action === 'stats' && req.method === 'GET') {
      const { data: usersData } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1 });

      const [
        { count: invoiceCount },
        { count: quoteCount },
        { count: blogCount },
        { count: publishedBlogCount },
        { count: paidSubs },
      ] = await Promise.all([
        adminClient.from('invoices').select('*', { count: 'exact', head: true }),
        adminClient.from('quotes').select('*', { count: 'exact', head: true }),
        adminClient.from('blog_posts').select('*', { count: 'exact', head: true }),
        adminClient.from('blog_posts').select('*', { count: 'exact', head: true }).eq('published', true),
        adminClient.from('subscriptions').select('*', { count: 'exact', head: true }).neq('plan', 'free').eq('status', 'active'),
      ]);

      return json({
        totalUsers: usersData?.users?.length || 0,
        totalInvoices: invoiceCount || 0,
        totalQuotes: quoteCount || 0,
        totalBlogPosts: blogCount || 0,
        publishedBlogPosts: publishedBlogCount || 0,
        paidSubscriptions: paidSubs || 0,
      });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});

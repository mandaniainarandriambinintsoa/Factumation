import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ADMIN_EMAIL = 'mandaniaina.randriambinintsoa@gmail.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify admin from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Verify caller identity with anon client
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await anonClient.auth.getUser();

    if (authError || !user || user.email !== ADMIN_EMAIL) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Admin-level client
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (action === 'list-users') {
      const page = parseInt(url.searchParams.get('page') || '1');
      const perPage = parseInt(url.searchParams.get('perPage') || '20');

      const { data, error } = await adminClient.auth.admin.listUsers({
        page,
        perPage,
      });

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

      return new Response(JSON.stringify({ users, total: data.users.length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'stats') {
      // Count users
      const { data: usersData } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1 });

      // Count invoices
      const { count: invoiceCount } = await adminClient
        .from('invoices')
        .select('*', { count: 'exact', head: true });

      // Count quotes
      const { count: quoteCount } = await adminClient
        .from('quotes')
        .select('*', { count: 'exact', head: true });

      // Count blog posts
      const { count: blogCount } = await adminClient
        .from('blog_posts')
        .select('*', { count: 'exact', head: true });

      // Count published blog posts
      const { count: publishedBlogCount } = await adminClient
        .from('blog_posts')
        .select('*', { count: 'exact', head: true })
        .eq('published', true);

      return new Response(JSON.stringify({
        totalUsers: usersData?.users?.length || 0,
        totalInvoices: invoiceCount || 0,
        totalQuotes: quoteCount || 0,
        totalBlogPosts: blogCount || 0,
        publishedBlogPosts: publishedBlogCount || 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

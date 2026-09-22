'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { adminRequest } from '@/lib/api/admin-server';
import { createClient } from '@/lib/supabase/server';

const updateSchema = z.object({
  locale: z.enum(['fr', 'en']),
  userId: z.string().uuid(),
  plan: z.enum(['free', 'pro', 'business']),
  status: z.enum(['active', 'canceled', 'past_due', 'trialing', 'incomplete']),
  manualExpiresAt: z.string().max(32).optional(),
  adminNotes: z.string().trim().max(500).optional(),
});

export async function updateSubscriptionAction(formData: FormData): Promise<void> {
  const result = updateSchema.safeParse({
    locale: formData.get('locale'),
    userId: formData.get('userId'),
    plan: formData.get('plan'),
    status: formData.get('status'),
    manualExpiresAt: formData.get('manualExpiresAt') || undefined,
    adminNotes: formData.get('adminNotes') || undefined,
  });
  if (!result.success) throw new Error('Données d’abonnement invalides.');

  const { locale, userId, plan, status, manualExpiresAt, adminNotes } = result.data;
  await adminRequest('update-subscription', {
    method: 'POST',
    body: {
      userId,
      plan,
      status,
      manualExpiresAt: manualExpiresAt
        ? new Date(`${manualExpiresAt}T23:59:59.999Z`).toISOString()
        : null,
      adminNotes: adminNotes ?? null,
    },
  });
  revalidatePath(`/${locale}/admin`);
  redirect(`/${locale}/admin?updated=1`);
}

const broadcastSchema = z.object({
  locale: z.enum(['fr', 'en']),
  userIds: z.array(z.string().uuid()).min(1).max(500),
  subject: z.string().trim().min(2).max(200),
  html: z.string().trim().min(10).max(50_000),
});

export async function broadcastAction(formData: FormData): Promise<void> {
  const result = broadcastSchema.safeParse({
    locale: formData.get('locale'),
    userIds: formData.getAll('userIds'),
    subject: formData.get('subject'),
    html: formData.get('html'),
  });
  if (!result.success) throw new Error('Message ou destinataires invalides.');
  const { locale, ...body } = result.data;
  await adminRequest('broadcast-email', { method: 'POST', body });
  redirect(`/${locale}/admin?broadcast=sent`);
}

const blogSchema = z.object({
  id: z.string().uuid().optional(),
  locale: z.enum(['fr', 'en']),
  lang: z.enum(['fr', 'en']),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(180),
  title: z.string().trim().min(3).max(240),
  excerpt: z.string().trim().min(10).max(600),
  content: z.string().trim().min(20).max(100_000),
  keywords: z.string().max(1000),
  author: z.string().trim().min(2).max(120),
  readTime: z.coerce.number().int().min(1).max(180),
  published: z.boolean(),
});

async function assertAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims?.email !== 'mandaniaina.randriambinintsoa@gmail.com')
    throw new Error('Forbidden');
  return supabase;
}

export async function saveBlogPostAction(formData: FormData): Promise<void> {
  const result = blogSchema.safeParse({
    id: formData.get('id') || undefined,
    locale: formData.get('locale'),
    lang: formData.get('lang'),
    slug: formData.get('slug'),
    title: formData.get('title'),
    excerpt: formData.get('excerpt'),
    content: formData.get('content'),
    keywords: formData.get('keywords'),
    author: formData.get('author'),
    readTime: formData.get('readTime'),
    published: formData.get('published') === 'on',
  });
  if (!result.success) throw new Error('Article invalide.');
  const { id, locale, readTime, keywords, ...input } = result.data;
  const supabase = await assertAdmin();
  let publishedAt: string | undefined;
  if (input.published) {
    const existing = id
      ? await supabase.from('blog_posts').select('published_at').eq('id', id).maybeSingle()
      : null;
    publishedAt = existing?.data?.published_at ?? new Date().toISOString();
  }
  const values = {
    ...input,
    keywords: keywords
      .split(',')
      .map((keyword) => keyword.trim())
      .filter(Boolean),
    read_time: readTime,
    ...(publishedAt ? { published_at: publishedAt } : {}),
  };
  const operation = id
    ? supabase.from('blog_posts').update(values).eq('id', id)
    : supabase.from('blog_posts').insert(values);
  const { error } = await operation;
  if (error) throw new Error('L’article n’a pas pu être enregistré.');
  revalidatePath(`/${locale}/blog`);
  revalidatePath(`/${locale}/admin`);
  redirect(`/${locale}/admin?blog=saved`);
}

export async function deleteBlogPostAction(formData: FormData): Promise<void> {
  const parsed = z
    .object({ locale: z.enum(['fr', 'en']), id: z.string().uuid() })
    .safeParse({ locale: formData.get('locale'), id: formData.get('id') });
  if (!parsed.success) throw new Error('Article invalide.');
  const supabase = await assertAdmin();
  const { error } = await supabase.from('blog_posts').delete().eq('id', parsed.data.id);
  if (error) throw new Error('L’article n’a pas pu être supprimé.');
  revalidatePath(`/${parsed.data.locale}/blog`);
  revalidatePath(`/${parsed.data.locale}/admin`);
  redirect(`/${parsed.data.locale}/admin?blog=deleted`);
}

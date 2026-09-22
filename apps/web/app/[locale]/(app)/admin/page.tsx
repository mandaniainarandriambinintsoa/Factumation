import { FileText, Quote, Rss, Users } from 'lucide-react';
import { notFound } from 'next/navigation';

import { ApiErrorState } from '@/components/api-error-state';
import { PageHeader } from '@/components/page-header';
import { adminRequest } from '@/lib/api/admin-server';
import { createClient } from '@/lib/supabase/server';

import {
  broadcastAction,
  deleteBlogPostAction,
  saveBlogPostAction,
  updateSubscriptionAction,
} from './actions';

type Stats = {
  totalUsers: number;
  totalInvoices: number;
  totalQuotes: number;
  totalBlogPosts: number;
  publishedBlogPosts: number;
  paidSubscriptions?: number;
};
type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  provider: string;
  createdAt: string;
  lastSignIn: string | null;
  plan: 'free' | 'pro' | 'business';
  status: string;
  source: string;
};
type BlogPost = {
  id: string;
  slug: string;
  lang: 'fr' | 'en';
  title: string;
  excerpt: string;
  content: string;
  keywords: string[];
  author: string;
  published: boolean;
  read_time: number;
};

export default async function AdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims?.email !== 'mandaniaina.randriambinintsoa@gmail.com') notFound();
  const page = Math.max(1, Number.parseInt(query.page ?? '1', 10) || 1);
  const [statsResult, usersResult, blogResult] = await Promise.allSettled([
    adminRequest<Stats>('stats'),
    adminRequest<{ users: AdminUser[]; total: number }>('list-users-with-subs', {
      query: { page: String(page), perPage: '20' },
    }),
    supabase
      .from('blog_posts')
      .select('id,slug,lang,title,excerpt,content,keywords,author,published,read_time')
      .order('updated_at', { ascending: false }),
  ]);
  const stats = statsResult.status === 'fulfilled' ? statsResult.value : null;
  const users = usersResult.status === 'fulfilled' ? usersResult.value : null;
  const blogPosts =
    blogResult.status === 'fulfilled' && !blogResult.value.error
      ? (blogResult.value.data as BlogPost[])
      : [];
  return (
    <main className="mx-auto max-w-7xl px-5 py-8 lg:px-10 lg:py-12">
      <PageHeader
        eyebrow="Administration"
        title="Pilotage"
        description="Vue globale de Factumation et de ses utilisateurs."
      />
      {!stats || !users ? (
        <ApiErrorState message="Le service d’administration n’est pas disponible." />
      ) : (
        <>
          <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [Users, 'Utilisateurs', stats.totalUsers],
              [FileText, 'Factures', stats.totalInvoices],
              [Quote, 'Devis', stats.totalQuotes],
              [Rss, 'Articles publiés', stats.publishedBlogPosts],
            ].map(([Icon, label, value]) => {
              const CardIcon = Icon as typeof Users;
              return (
                <article
                  key={String(label)}
                  className="rounded-xl border border-slate-200 bg-white p-5"
                >
                  <span className="grid size-10 place-items-center rounded-full bg-blue-50 text-blue-600">
                    <CardIcon className="size-5" />
                  </span>
                  <p className="mt-5 text-2xl font-bold text-slate-900">{String(value)}</p>
                  <p className="mt-1 text-sm text-slate-500">{String(label)}</p>
                </article>
              );
            })}
          </section>
          <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="font-semibold text-slate-900">Utilisateurs récents</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-6 py-3">Utilisateur</th>
                    <th className="px-6 py-3">Fournisseur</th>
                    <th className="px-6 py-3">Plan</th>
                    <th className="px-6 py-3">Statut</th>
                    <th className="px-6 py-3">Inscription</th>
                    <th className="px-6 py-3">Gestion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4">
                        <strong className="block text-slate-900">{user.name ?? 'Sans nom'}</strong>
                        <span className="text-xs text-slate-500">{user.email}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{user.provider}</td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                          {user.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{user.status}</td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-GB').format(
                          new Date(user.createdAt),
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <details>
                          <summary className="focus-ring cursor-pointer rounded-md text-sm font-semibold text-blue-700">
                            Modifier
                          </summary>
                          <form action={updateSubscriptionAction} className="mt-3 grid w-64 gap-2">
                            <input
                              type="hidden"
                              name="locale"
                              value={locale === 'en' ? 'en' : 'fr'}
                            />
                            <input type="hidden" name="userId" value={user.id} />
                            <label className="text-xs font-medium text-slate-600">
                              Plan
                              <select
                                name="plan"
                                defaultValue={user.plan}
                                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-sm"
                              >
                                <option value="free">Gratuit</option>
                                <option value="pro">Pro</option>
                                <option value="business">Business</option>
                              </select>
                            </label>
                            <label className="text-xs font-medium text-slate-600">
                              Statut
                              <select
                                name="status"
                                defaultValue={user.status}
                                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-sm"
                              >
                                <option value="active">Actif</option>
                                <option value="trialing">Essai</option>
                                <option value="past_due">Impayé</option>
                                <option value="canceled">Annulé</option>
                                <option value="incomplete">Incomplet</option>
                              </select>
                            </label>
                            <label className="text-xs font-medium text-slate-600">
                              Expiration manuelle
                              <input
                                type="date"
                                name="manualExpiresAt"
                                className="mt-1 w-full rounded-md border border-slate-200 px-2 py-2 text-sm"
                              />
                            </label>
                            <label className="text-xs font-medium text-slate-600">
                              Note admin
                              <textarea
                                name="adminNotes"
                                rows={2}
                                maxLength={500}
                                className="mt-1 w-full rounded-md border border-slate-200 px-2 py-2 text-sm"
                              />
                            </label>
                            <button
                              type="submit"
                              className="focus-ring rounded-md bg-[var(--primary-900)] px-3 py-2 text-sm font-semibold text-white"
                            >
                              Enregistrer
                            </button>
                          </form>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="mt-6 grid gap-6 xl:grid-cols-2">
            <article className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="font-semibold text-slate-900">Diffusion e-mail</h2>
              <p className="mt-1 text-sm text-slate-500">
                Envoyer un message aux utilisateurs sélectionnés via Resend.
              </p>
              <form action={broadcastAction} className="mt-5 space-y-4">
                <input type="hidden" name="locale" value={locale === 'en' ? 'en' : 'fr'} />
                <fieldset className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3">
                  <legend className="px-1 text-xs font-semibold text-slate-600">
                    Destinataires
                  </legend>
                  {users.users.map((user) => (
                    <label key={user.id} className="flex items-center gap-2 text-sm text-slate-600">
                      <input type="checkbox" name="userIds" value={user.id} />
                      <span className="truncate">{user.email}</span>
                    </label>
                  ))}
                </fieldset>
                <label className="block text-sm font-medium text-slate-700">
                  Sujet
                  <input
                    name="subject"
                    required
                    maxLength={200}
                    className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3"
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Contenu HTML
                  <textarea
                    name="html"
                    required
                    minLength={10}
                    rows={6}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 p-3 font-mono text-xs"
                  />
                </label>
                <button className="focus-ring rounded-lg bg-[var(--primary-900)] px-4 py-2.5 text-sm font-semibold text-white">
                  Envoyer la diffusion
                </button>
              </form>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="font-semibold text-slate-900">Nouvel article</h2>
              <BlogPostForm locale={locale} />
            </article>
          </section>
          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold text-slate-900">Articles du blog</h2>
            <div className="mt-4 space-y-3">
              {blogPosts.length ? (
                blogPosts.map((post) => (
                  <details key={post.id} className="rounded-lg border border-slate-200 p-4">
                    <summary className="focus-ring cursor-pointer font-medium text-slate-800">
                      {post.title} · {post.lang.toUpperCase()} ·{' '}
                      {post.published ? 'Publié' : 'Brouillon'}
                    </summary>
                    <BlogPostForm locale={locale} post={post} />
                    <form action={deleteBlogPostAction} className="mt-3">
                      <input type="hidden" name="locale" value={locale === 'en' ? 'en' : 'fr'} />
                      <input type="hidden" name="id" value={post.id} />
                      <button className="focus-ring rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700">
                        Supprimer
                      </button>
                    </form>
                  </details>
                ))
              ) : (
                <p className="text-sm text-slate-500">Aucun article géré en base.</p>
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function BlogPostForm({ locale, post }: { locale: string; post?: BlogPost }) {
  const field = 'mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm';
  return (
    <form action={saveBlogPostAction} className="mt-4 grid gap-3">
      <input type="hidden" name="locale" value={locale === 'en' ? 'en' : 'fr'} />
      {post ? <input type="hidden" name="id" value={post.id} /> : null}
      <div className="grid gap-3 sm:grid-cols-[100px_1fr]">
        <label className="text-sm font-medium text-slate-700">
          Langue
          <select name="lang" defaultValue={post?.lang ?? 'fr'} className={field}>
            <option value="fr">FR</option>
            <option value="en">EN</option>
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Slug
          <input name="slug" required defaultValue={post?.slug} className={field} />
        </label>
      </div>
      <label className="text-sm font-medium text-slate-700">
        Titre
        <input name="title" required defaultValue={post?.title} className={field} />
      </label>
      <label className="text-sm font-medium text-slate-700">
        Extrait
        <textarea name="excerpt" required rows={2} defaultValue={post?.excerpt} className={field} />
      </label>
      <label className="text-sm font-medium text-slate-700">
        Contenu Markdown
        <textarea
          name="content"
          required
          rows={8}
          defaultValue={post?.content}
          className={`${field} font-mono text-xs`}
        />
      </label>
      <label className="text-sm font-medium text-slate-700">
        Mots-clés séparés par des virgules
        <input name="keywords" defaultValue={post?.keywords.join(', ')} className={field} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Auteur
          <input
            name="author"
            required
            defaultValue={post?.author ?? 'Factumation'}
            className={field}
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Temps de lecture
          <input
            name="readTime"
            type="number"
            min={1}
            max={180}
            required
            defaultValue={post?.read_time ?? 5}
            className={field}
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input type="checkbox" name="published" defaultChecked={post?.published} /> Publier
      </label>
      <button className="focus-ring justify-self-start rounded-lg bg-[var(--primary-900)] px-4 py-2.5 text-sm font-semibold text-white">
        {post ? 'Mettre à jour' : 'Créer l’article'}
      </button>
    </form>
  );
}

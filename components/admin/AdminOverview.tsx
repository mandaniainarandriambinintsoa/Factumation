import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, FileText, FileCheck, BookOpen, Loader2 } from 'lucide-react';
import { useLocalizedPath } from '../../hooks/useLocalizedPath';
import { getAdminStats, AdminStats } from '../../services/adminService';
import { getAllBlogPosts, BlogPostRecord } from '../../services/blogAdminService';

const AdminOverview: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentPosts, setRecentPosts] = useState<BlogPostRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { path } = useLocalizedPath();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, posts] = await Promise.all([
        getAdminStats().catch(() => null),
        getAllBlogPosts(),
      ]);
      setStats(statsData);
      setRecentPosts(posts.slice(0, 5));
    } catch (err) {
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const statCards = [
    { label: 'Utilisateurs', value: stats?.totalUsers ?? '—', icon: Users, color: 'bg-blue-500' },
    { label: 'Factures', value: stats?.totalInvoices ?? '—', icon: FileText, color: 'bg-green-500' },
    { label: 'Devis', value: stats?.totalQuotes ?? '—', icon: FileCheck, color: 'bg-purple-500' },
    { label: 'Articles publiés', value: stats?.publishedBlogPosts ?? '—', icon: BookOpen, color: 'bg-orange-500' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Vue d'ensemble</h2>

      {error && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
          {error} — Les stats du serveur ne sont peut-être pas disponibles. Les articles blog sont chargés depuis Supabase.
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`${card.color} p-2 rounded-lg`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm text-slate-500">{card.label}</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Blog Posts */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Derniers articles modifiés</h3>
          <Link
            to={path('/admin/blog')}
            className="text-sm text-primary-600 hover:text-primary-800"
          >
            Voir tout →
          </Link>
        </div>
        {recentPosts.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Aucun article. <Link to={path('/admin/blog/new')} className="text-primary-600 hover:underline">Créer le premier</Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentPosts.map((post) => (
              <div key={post.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                <div className="min-w-0 flex-1">
                  <Link
                    to={path(`/admin/blog/${post.id}`)}
                    className="font-medium text-slate-900 hover:text-primary-600 truncate block"
                  >
                    {post.title}
                  </Link>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span className="uppercase">{post.lang}</span>
                    <span>{new Date(post.updated_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
                <span className={`ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  post.published
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {post.published ? 'Publié' : 'Brouillon'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOverview;

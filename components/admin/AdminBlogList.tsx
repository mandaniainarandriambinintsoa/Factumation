import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Loader2, Globe, Eye, EyeOff } from 'lucide-react';
import { useLocalizedPath } from '../../hooks/useLocalizedPath';
import { getAllBlogPosts, deleteBlogPost, BlogPostRecord } from '../../services/blogAdminService';

const AdminBlogList: React.FC = () => {
  const [posts, setPosts] = useState<BlogPostRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { path } = useLocalizedPath();

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    const data = await getAllBlogPosts();
    setPosts(data);
    setLoading(false);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Supprimer l'article "${title}" ?`)) return;
    setDeleting(id);
    const success = await deleteBlogPost(id);
    if (success) {
      setPosts(posts.filter((p) => p.id !== id));
    }
    setDeleting(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Articles du blog</h2>
        <Link
          to={path('/admin/blog/new')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-900 text-white rounded-lg hover:bg-primary-800 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nouvel article
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-500 mb-4">Aucun article pour le moment</p>
          <Link
            to={path('/admin/blog/new')}
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-800 font-medium"
          >
            <Plus className="w-4 h-4" />
            Créer le premier article
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3">Titre</th>
                  <th className="px-5 py-3">Slug</th>
                  <th className="px-5 py-3">Langue</th>
                  <th className="px-5 py-3">Statut</th>
                  <th className="px-5 py-3">Mis à jour</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <Link
                        to={path(`/admin/blog/${post.id}`)}
                        className="font-medium text-slate-900 hover:text-primary-600"
                      >
                        {post.title}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500 font-mono">{post.slug}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
                        <Globe className="w-3 h-3" />
                        {post.lang.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        post.published
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {post.published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {post.published ? 'Publié' : 'Brouillon'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500">{formatDate(post.updated_at)}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={path(`/admin/blog/${post.id}`)}
                          className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Éditer"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(post.id, post.title)}
                          disabled={deleting === post.id}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Supprimer"
                        >
                          {deleting === post.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {posts.map((post) => (
              <div key={post.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <Link
                    to={path(`/admin/blog/${post.id}`)}
                    className="font-medium text-slate-900 hover:text-primary-600 flex-1 mr-2"
                  >
                    {post.title}
                  </Link>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                    post.published
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {post.published ? 'Publié' : 'Brouillon'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                  <span>{post.lang.toUpperCase()}</span>
                  <span>{formatDate(post.updated_at)}</span>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={path(`/admin/blog/${post.id}`)}
                    className="px-3 py-1.5 text-xs font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50"
                  >
                    Éditer
                  </Link>
                  <button
                    onClick={() => handleDelete(post.id, post.title)}
                    disabled={deleting === post.id}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBlogList;

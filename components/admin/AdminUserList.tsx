import React, { useEffect, useState } from 'react';
import { Users, Loader2, Mail, Calendar, Shield } from 'lucide-react';
import { getUsers, AdminUser } from '../../services/adminService';

const AdminUserList: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 20;

  useEffect(() => {
    loadUsers();
  }, [page]);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUsers(page, perPage);
      setUsers(data.users);
    } catch (err) {
      setError((err as Error).message || 'Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Utilisateurs</h2>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Users className="w-4 h-4" />
          {users.length} utilisateur(s)
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
          <p className="mt-1 text-red-500">Vérifiez que l'edge function <code>admin</code> est déployée.</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3">Utilisateur</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Provider</th>
                  <th className="px-5 py-3">Inscription</th>
                  <th className="px-5 py-3">Dernière connexion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                            <Users className="w-4 h-4 text-slate-500" />
                          </div>
                        )}
                        <span className="font-medium text-slate-900">{user.name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{user.email}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.provider === 'google'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Shield className="w-3 h-3" />
                        {user.provider}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500">{formatDate(user.createdAt)}</td>
                    <td className="px-5 py-4 text-sm text-slate-500">{formatDate(user.lastSignIn)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {users.map((user) => (
              <div key={user.id} className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                      <Users className="w-5 h-5 text-slate-500" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-slate-900">{user.name || '—'}</p>
                    <p className="text-sm text-slate-500">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                  <span className="flex items-center gap-1">
                    <Shield className="w-3 h-3" /> {user.provider}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {formatDate(user.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {users.length === 0 && !error && (
            <div className="p-12 text-center text-slate-500">Aucun utilisateur trouvé</div>
          )}
        </div>
      )}

      {/* Pagination */}
      {users.length >= perPage && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Précédent
          </button>
          <span className="px-4 py-2 text-sm text-slate-600">Page {page}</span>
          <button
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminUserList;

import React from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, ArrowLeft, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocalizedPath } from '../hooks/useLocalizedPath';
import { isAdmin } from '../services/adminService';
import AdminOverview from './admin/AdminOverview';
import AdminUserList from './admin/AdminUserList';
import AdminBlogList from './admin/AdminBlogList';
import AdminBlogForm from './admin/AdminBlogForm';

const sidebarLinks = [
  { label: 'Vue d\'ensemble', path: '', icon: LayoutDashboard },
  { label: 'Utilisateurs', path: '/users', icon: Users },
  { label: 'Blog', path: '/blog', icon: BookOpen },
];

const Admin: React.FC = () => {
  const { user, loading } = useAuth();
  const { path } = useLocalizedPath();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user || !isAdmin(user.email)) {
    return <Navigate to={path('/')} replace />;
  }

  const isActiveLink = (linkPath: string) => {
    const fullPath = path(`/admin${linkPath}`);
    if (linkPath === '') {
      return location.pathname === fullPath;
    }
    return location.pathname.startsWith(fullPath);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary-600" />
            <h1 className="text-lg font-bold text-slate-900">Administration</h1>
          </div>
          <Link
            to={path('/')}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au site
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-56 shrink-0">
            <nav className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {sidebarLinks.map((link) => (
                <Link
                  key={link.path}
                  to={path(`/admin${link.path}`)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                    isActiveLink(link.path)
                      ? 'bg-primary-50 text-primary-900 border-l-3 border-primary-600'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            <Routes>
              <Route index element={<AdminOverview />} />
              <Route path="users" element={<AdminUserList />} />
              <Route path="blog" element={<AdminBlogList />} />
              <Route path="blog/new" element={<AdminBlogForm />} />
              <Route path="blog/:id" element={<AdminBlogForm />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Admin;

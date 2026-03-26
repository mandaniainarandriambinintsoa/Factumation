import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FileText, Home, ClipboardList, History, Tag, Info, Mail, BookOpen,
  Settings, Shield, LogOut, User, X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useLocalizedPath } from '../hooks/useLocalizedPath';
import { isAdmin } from '../services/adminService';
import LanguageSwitcher from './LanguageSwitcher';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, signOut } = useAuth();
  const { t } = useI18n();
  const { path } = useLocalizedPath();
  const location = useLocation();

  const isActive = (rawPath: string) => location.pathname === path(rawPath);

  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close sidebar on route change
  useEffect(() => {
    onClose();
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  const primaryLinks = [
    { name: t('nav.home'), path: '/', icon: Home },
    { name: t('nav.invoice'), path: '/create', icon: FileText },
    { name: t('nav.quote'), path: '/quote', icon: ClipboardList },
    { name: t('nav.history'), path: '/dashboard', icon: History },
  ];

  const secondaryLinks = [
    { name: t('nav.pricing'), path: '/pricing', icon: Tag },
    { name: t('nav.about'), path: '/about', icon: Info },
    { name: t('nav.contact'), path: '/contact', icon: Mail },
    { name: t('nav.blog'), path: '/blog', icon: BookOpen },
  ];

  const linkClass = (rawPath: string) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive(rawPath)
        ? 'bg-primary-50 text-primary-900'
        : 'text-slate-600 hover:bg-slate-50 hover:text-primary-900'
    }`;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Slide-out panel */}
      <aside
        className={`fixed inset-y-0 left-0 w-72 bg-white z-50 shadow-xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header with logo + close */}
          <div className="flex items-center justify-between px-5 h-14 border-b border-slate-100 shrink-0">
            <Link to={path('/')} className="flex items-center gap-2.5" onClick={onClose}>
              <div className="bg-primary-900 text-white p-1.5 rounded-lg">
                <FileText size={20} />
              </div>
              <span className="font-bold text-lg text-primary-900 tracking-tight">Factumation</span>
            </Link>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Primary nav */}
          <div className="px-3 pt-5 pb-2">
            <p className="px-4 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Menu</p>
            <nav className="space-y-1">
              {primaryLinks.map((link) => (
                <Link key={link.path} to={path(link.path)} className={linkClass(link.path)}>
                  <link.icon size={18} />
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Secondary nav */}
          <div className="px-3 pt-3 pb-2">
            <hr className="mb-3 border-slate-100" />
            <p className="px-4 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {t('nav.about').split(' ')[0] === 'À' ? 'Autres' : 'More'}
            </p>
            <nav className="space-y-1">
              {secondaryLinks.map((link) => (
                <Link key={link.path} to={path(link.path)} className={linkClass(link.path)}>
                  <link.icon size={18} />
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Spacer */}
          <div className="flex-grow" />

          {/* Bottom section */}
          <div className="px-3 pb-4 shrink-0">
            <hr className="mb-3 border-slate-100" />

            <div className="space-y-1">
              <LanguageSwitcher />

              <Link to={path('/settings')} className={linkClass('/settings')}>
                <Settings size={18} />
                {t('nav.settings')}
              </Link>

              {user && isAdmin(user.email) && (
                <Link
                  to={path('/admin')}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-primary-700 hover:bg-primary-50 transition-colors"
                >
                  <Shield size={18} />
                  Admin
                </Link>
              )}
            </div>

            {/* User info */}
            {user && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-3 px-3 py-2">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-primary-600" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {user.name || user.email.split('@')[0]}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors w-full mt-1"
                >
                  <LogOut size={18} />
                  {t('nav.logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

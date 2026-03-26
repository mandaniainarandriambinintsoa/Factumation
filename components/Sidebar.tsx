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
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onMobileClose }) => {
  const { user, signOut } = useAuth();
  const { t } = useI18n();
  const { path } = useLocalizedPath();
  const location = useLocation();

  const isActive = (rawPath: string) => location.pathname === path(rawPath);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileOpen]);

  const handleSignOut = async () => {
    await signOut();
    onMobileClose();
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
        ? 'bg-primary-50 text-primary-900 border-l-3 border-primary-600'
        : 'text-slate-600 hover:bg-slate-50 hover:text-primary-900'
    }`;

  const navContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-slate-100 shrink-0">
        <div className="bg-primary-900 text-white p-1.5 rounded-lg">
          <FileText size={20} />
        </div>
        <span className="font-bold text-lg text-primary-900 tracking-tight">Factumation</span>
      </div>

      {/* Primary nav */}
      <div className="px-3 pt-6 pb-2">
        <p className="px-4 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Menu</p>
        <nav className="space-y-1">
          {primaryLinks.map((link) => (
            <Link
              key={link.path}
              to={path(link.path)}
              onClick={onMobileClose}
              className={linkClass(link.path)}
            >
              <link.icon size={18} />
              {link.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Secondary nav */}
      <div className="px-3 pt-4 pb-2">
        <hr className="mb-4 border-slate-100" />
        <p className="px-4 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {t('nav.about').split(' ')[0] === 'À' ? 'Autres' : 'More'}
        </p>
        <nav className="space-y-1">
          {secondaryLinks.map((link) => (
            <Link
              key={link.path}
              to={path(link.path)}
              onClick={onMobileClose}
              className={linkClass(link.path)}
            >
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

          <Link
            to={path('/settings')}
            onClick={onMobileClose}
            className={linkClass('/settings')}
          >
            <Settings size={18} />
            {t('nav.settings')}
          </Link>

          {user && isAdmin(user.email) && (
            <Link
              to={path('/admin')}
              onClick={onMobileClose}
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
  );

  return (
    <>
      {/* Desktop sidebar - fixed */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 bg-white border-r border-slate-200 z-40">
        {navContent}
      </aside>

      {/* Mobile sidebar - overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity duration-300 ${
          isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onMobileClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 w-72 bg-white z-50 lg:hidden shadow-xl transform transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Close button */}
        <button
          onClick={onMobileClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        >
          <X size={20} />
        </button>
        {navContent}
      </aside>
    </>
  );
};

export default Sidebar;

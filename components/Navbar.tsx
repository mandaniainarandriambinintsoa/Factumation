import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, FileText, User, LogOut, LayoutDashboard, ChevronDown, History, Settings, Shield } from 'lucide-react';
import { isAdmin } from '../services/adminService';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useLocalizedPath } from '../hooks/useLocalizedPath';
import AuthModal from './AuthModal';
import LanguageSwitcher from './LanguageSwitcher';
import { Button } from './ui/button';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const location = useLocation();
  const { user, loading, signOut } = useAuth();
  const { t } = useI18n();
  const { path } = useLocalizedPath();

  const toggleMenu = () => setIsOpen(!isOpen);

  const isActive = (rawPath: string) => location.pathname === path(rawPath);

  const openLoginModal = () => {
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
    setIsOpen(false);
  };

  const openRegisterModal = () => {
    setAuthModalMode('register');
    setIsAuthModalOpen(true);
    setIsOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setIsUserMenuOpen(false);
  };

  const baseNavLinks = [
    { name: t('nav.home'), path: '/' },
    { name: t('nav.invoice'), path: '/create' },
    { name: t('nav.quote'), path: '/quote' },
  ];

  const secondaryNavLinks = [
    { name: t('nav.pricing'), path: '/pricing' },
    { name: t('nav.about'), path: '/about' },
    { name: t('nav.contact'), path: '/contact' },
    { name: t('nav.blog'), path: '/blog' },
  ];

  const historyLink = { name: t('nav.history'), path: '/dashboard', icon: History };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">

            {/* Logo */}
            <Link to={path('/')} className="flex items-center gap-2 group">
              <div className="bg-primary-900 text-white p-2 rounded-lg group-hover:scale-105 transition-transform duration-200">
                <FileText size={24} />
              </div>
              <span className="font-bold text-xl text-primary-900 tracking-tight">Factumation</span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center space-x-6">
              {baseNavLinks.map((link) => (
                <Link
                  key={link.path}
                  to={path(link.path)}
                  className={`text-sm font-medium transition-colors duration-200 ${
                    isActive(link.path)
                      ? 'text-primary-900 border-b-2 border-primary-900'
                      : 'text-slate-600 hover:text-primary-900'
                  }`}
                >
                  {link.name}
                </Link>
              ))}

              {user && (
                <Link
                  to={path(historyLink.path)}
                  className={`text-sm font-medium transition-colors duration-200 flex items-center gap-1.5 ${
                    isActive(historyLink.path)
                      ? 'text-primary-900 border-b-2 border-primary-900'
                      : 'text-slate-600 hover:text-primary-900'
                  }`}
                >
                  <History size={16} />
                  {historyLink.name}
                </Link>
              )}

              {secondaryNavLinks.map((link) => (
                <Link
                  key={link.path}
                  to={path(link.path)}
                  className={`text-sm font-medium transition-colors duration-200 ${
                    isActive(link.path)
                      ? 'text-primary-900 border-b-2 border-primary-900'
                      : 'text-slate-600 hover:text-primary-900'
                  }`}
                >
                  {link.name}
                </Link>
              ))}

              {/* Language Switcher */}
              <LanguageSwitcher />

              {/* Auth Section */}
              {!loading && (
                <div className="flex items-center gap-3 ml-4 pl-4 border-l border-slate-200">
                  {user ? (
                    <div className="relative">
                      <Button
                        variant="ghost"
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className="gap-2 px-3 h-auto py-2"
                      >
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.name || 'Avatar'}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <User className="w-4 h-4 text-primary-600" />
                          </div>
                        )}
                        <span className="text-sm font-medium text-slate-700 max-w-[120px] truncate">
                          {user.name || user.email.split('@')[0]}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                      </Button>

                      {isUserMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setIsUserMenuOpen(false)}
                          />
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                            <Link
                              to={path('/dashboard')}
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            >
                              <LayoutDashboard className="w-4 h-4" />
                              {t('nav.myHistory')}
                            </Link>
                            <Link
                              to={path('/settings')}
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            >
                              <Settings className="w-4 h-4" />
                              {t('nav.settings')}
                            </Link>
                            {isAdmin(user.email) && (
                              <Link
                                to={path('/admin')}
                                onClick={() => setIsUserMenuOpen(false)}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-primary-700 hover:bg-primary-50"
                              >
                                <Shield className="w-4 h-4" />
                                Admin
                              </Link>
                            )}
                            <hr className="my-1 border-slate-100" />
                            <button
                              type="button"
                              onClick={handleSignOut}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors"
                            >
                              <LogOut className="w-4 h-4" />
                              {t('nav.logout')}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        onClick={openLoginModal}
                        className="text-slate-600 hover:text-primary-900"
                      >
                        {t('nav.login')}
                      </Button>
                      <Button
                        onClick={openRegisterModal}
                        className="rounded-full"
                      >
                        {t('nav.register')}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center gap-2">
              <LanguageSwitcher />
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMenu}
                className="text-slate-600 hover:text-primary-900"
                aria-label="Menu"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Content */}
        {isOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 animate-fade-in">
            <div className="px-4 pt-2 pb-4 space-y-1">
              {baseNavLinks.map((link) => (
                <Link
                  key={link.path}
                  to={path(link.path)}
                  onClick={() => setIsOpen(false)}
                  className={`block px-3 py-3 rounded-md text-base font-medium ${
                    isActive(link.path)
                      ? 'bg-primary-50 text-primary-900'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-primary-900'
                  }`}
                >
                  {link.name}
                </Link>
              ))}

              {user && (
                <Link
                  to={path(historyLink.path)}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-2 px-3 py-3 rounded-md text-base font-medium ${
                    isActive(historyLink.path)
                      ? 'bg-primary-50 text-primary-900'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-primary-900'
                  }`}
                >
                  <History size={18} />
                  {historyLink.name}
                </Link>
              )}

              {secondaryNavLinks.map((link) => (
                <Link
                  key={link.path}
                  to={path(link.path)}
                  onClick={() => setIsOpen(false)}
                  className={`block px-3 py-3 rounded-md text-base font-medium ${
                    isActive(link.path)
                      ? 'bg-primary-50 text-primary-900'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-primary-900'
                  }`}
                >
                  {link.name}
                </Link>
              ))}

              {/* Mobile Auth Section */}
              {!loading && (
                <div className="pt-4 mt-4 border-t border-slate-200">
                  {user ? (
                    <>
                      <div className="flex items-center gap-3 px-3 py-3">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.name || 'Avatar'}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary-600" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-slate-900">{user.name || user.email.split('@')[0]}</p>
                          <p className="text-sm text-slate-500">{user.email}</p>
                        </div>
                      </div>
                      <Link
                        to={path('/settings')}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-2 px-3 py-3 text-slate-600 hover:bg-slate-50 rounded-md"
                      >
                        <Settings className="w-5 h-5" />
                        {t('nav.settings')}
                      </Link>
                      {isAdmin(user.email) && (
                        <Link
                          to={path('/admin')}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-2 px-3 py-3 text-primary-700 hover:bg-primary-50 rounded-md"
                        >
                          <Shield className="w-5 h-5" />
                          Admin
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          handleSignOut();
                          setIsOpen(false);
                        }}
                        className="flex items-center gap-2 px-3 py-3 text-red-600 hover:bg-red-50 rounded-md w-full"
                      >
                        <LogOut className="w-5 h-5" />
                        {t('nav.logout')}
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        onClick={openLoginModal}
                        className="w-full h-12"
                      >
                        {t('nav.login')}
                      </Button>
                      <Button
                        onClick={openRegisterModal}
                        className="w-full h-12"
                      >
                        {t('nav.register')}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </>
  );
};

export default Navbar;

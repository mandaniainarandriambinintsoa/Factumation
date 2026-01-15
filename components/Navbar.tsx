import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, FileText, User, LogOut, LayoutDashboard, ChevronDown, History, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const location = useLocation();
  const { user, loading, signOut } = useAuth();

  const toggleMenu = () => setIsOpen(!isOpen);

  const isActive = (path: string) => location.pathname === path;

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

  // Liens de navigation de base
  const baseNavLinks = [
    { name: 'Accueil', path: '/' },
    { name: 'Facture', path: '/create' },
    { name: 'Devis', path: '/quote' },
  ];

  // Liens supplémentaires
  const secondaryNavLinks = [
    { name: 'À propos', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  // Lien Historique (visible seulement si connecté)
  const historyLink = { name: 'Historique', path: '/dashboard', icon: History };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-primary-900 text-white p-2 rounded-lg group-hover:scale-105 transition-transform duration-200">
                <FileText size={24} />
              </div>
              <span className="font-bold text-xl text-primary-900 tracking-tight">FactuPro</span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              {/* Liens de base */}
              {baseNavLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`text-sm font-medium transition-colors duration-200 ${
                    isActive(link.path)
                      ? 'text-primary-900 border-b-2 border-primary-900'
                      : 'text-slate-600 hover:text-primary-900'
                  }`}
                >
                  {link.name}
                </Link>
              ))}

              {/* Lien Historique - visible seulement si connecté */}
              {user && (
                <Link
                  to={historyLink.path}
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

              {/* Liens secondaires */}
              {secondaryNavLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`text-sm font-medium transition-colors duration-200 ${
                    isActive(link.path)
                      ? 'text-primary-900 border-b-2 border-primary-900'
                      : 'text-slate-600 hover:text-primary-900'
                  }`}
                >
                  {link.name}
                </Link>
              ))}

              {/* Auth Section */}
              {!loading && (
                <div className="flex items-center gap-3 ml-4 pl-4 border-l border-slate-200">
                  {user ? (
                    <div className="relative">
                      <button
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
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
                      </button>

                      {/* User Dropdown Menu */}
                      {isUserMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setIsUserMenuOpen(false)}
                          />
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                            <Link
                              to="/dashboard"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            >
                              <LayoutDashboard className="w-4 h-4" />
                              Mon historique
                            </Link>
                            <Link
                              to="/settings"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            >
                              <Settings className="w-4 h-4" />
                              Paramètres
                            </Link>
                            <hr className="my-1 border-slate-100" />
                            <button
                              onClick={handleSignOut}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                            >
                              <LogOut className="w-4 h-4" />
                              Déconnexion
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={openLoginModal}
                        className="text-sm font-medium text-slate-600 hover:text-primary-900 transition-colors"
                      >
                        Connexion
                      </button>
                      <button
                        onClick={openRegisterModal}
                        className="text-sm font-medium px-4 py-2 bg-primary-900 text-white rounded-full hover:bg-primary-800 transition-colors"
                      >
                        S'inscrire
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={toggleMenu}
                className="text-slate-600 hover:text-primary-900 focus:outline-none p-2"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Content */}
        {isOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 animate-fade-in">
            <div className="px-4 pt-2 pb-4 space-y-1">
              {/* Liens de base */}
              {baseNavLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
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

              {/* Lien Historique - visible seulement si connecté */}
              {user && (
                <Link
                  to={historyLink.path}
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

              {/* Liens secondaires */}
              {secondaryNavLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
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
                        to="/settings"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-2 px-3 py-3 text-slate-600 hover:bg-slate-50 rounded-md"
                      >
                        <Settings className="w-5 h-5" />
                        Paramètres
                      </Link>
                      <button
                        onClick={() => {
                          handleSignOut();
                          setIsOpen(false);
                        }}
                        className="flex items-center gap-2 px-3 py-3 text-red-600 hover:bg-red-50 rounded-md w-full"
                      >
                        <LogOut className="w-5 h-5" />
                        Déconnexion
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={openLoginModal}
                        className="w-full px-4 py-3 text-center font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
                      >
                        Connexion
                      </button>
                      <button
                        onClick={openRegisterModal}
                        className="w-full px-4 py-3 text-center font-medium text-white bg-primary-900 rounded-lg hover:bg-primary-800"
                      >
                        S'inscrire
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </>
  );
};

export default Navbar;

import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, FileText, User, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useLocalizedPath } from '../hooks/useLocalizedPath';
import LanguageSwitcher from './LanguageSwitcher';

interface SidebarTopBarProps {
  onMenuToggle: () => void;
}

const SidebarTopBar: React.FC<SidebarTopBarProps> = ({ onMenuToggle }) => {
  const { user } = useAuth();
  const { t } = useI18n();
  const { path } = useLocalizedPath();

  return (
    <header className="sticky top-0 z-30 h-14 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="flex items-center justify-between h-full px-4 sm:px-6 lg:px-8">
        {/* Left: hamburger + logo (mobile/tablet only) */}
        <div className="flex items-center gap-3 xl:hidden">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg text-slate-600 hover:text-primary-900 hover:bg-slate-100 transition-colors"
          >
            <Menu size={22} />
          </button>
          <Link to={path('/')} className="flex items-center gap-2">
            <div className="bg-primary-900 text-white p-1.5 rounded-lg">
              <FileText size={18} />
            </div>
            <span className="font-bold text-primary-900 hidden sm:inline">Factumation</span>
          </Link>
        </div>

        {/* Left spacer on desktop (sidebar has the logo) */}
        <div className="hidden xl:block" />

        {/* Right: language + settings + user */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />

          <Link
            to={path('/settings')}
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-primary-900 hover:bg-slate-100 transition-colors"
          >
            <Settings size={16} />
            <span>{t('nav.settings')}</span>
          </Link>

          {/* User avatar - mobile/tablet only (desktop has it in sidebar) */}
          {user && (
            <div className="xl:hidden flex items-center gap-2 pl-2">
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-600" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default SidebarTopBar;

import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, FileText, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocalizedPath } from '../hooks/useLocalizedPath';
import LanguageSwitcher from './LanguageSwitcher';

interface SidebarTopBarProps {
  onMenuToggle: () => void;
}

const SidebarTopBar: React.FC<SidebarTopBarProps> = ({ onMenuToggle }) => {
  const { user } = useAuth();
  const { path } = useLocalizedPath();

  return (
    <header className="xl:hidden sticky top-0 z-30 h-14 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-full px-4 sm:px-6 lg:px-8">
        {/* Left: hamburger + logo */}
        <div className="flex items-center gap-3">
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

        {/* Right: language + user */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          {user && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700 hidden md:inline max-w-[150px] truncate">
                {user.name || user.email.split('@')[0]}
              </span>
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

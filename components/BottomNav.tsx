import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, ClipboardList, History, Settings } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import { useLocalizedPath } from '../hooks/useLocalizedPath';
import { cn } from '../lib/utils';

const BottomNav: React.FC = () => {
  const { t } = useI18n();
  const { path } = useLocalizedPath();
  const location = useLocation();

  const items = [
    { to: '/',          label: t('nav.home'),    icon: Home },
    { to: '/create',    label: t('nav.invoice'), icon: FileText },
    { to: '/quote',     label: t('nav.quote'),   icon: ClipboardList },
    { to: '/dashboard', label: t('nav.history'), icon: History },
    { to: '/settings',  label: t('nav.settings'), icon: Settings },
  ];

  const isActive = (rawPath: string) => {
    const full = path(rawPath);
    if (rawPath === '/') return location.pathname === full;
    return location.pathname === full || location.pathname.startsWith(full + '/');
  };

  return (
    <nav
      aria-label="Navigation mobile"
      className="xl:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 z-[400] flex items-center justify-around px-1 shadow-[0_-2px_8px_rgba(15,23,42,0.04)]"
    >
      {items.map((item) => {
        const active = isActive(item.to);
        return (
          <Link
            key={item.to}
            to={path(item.to)}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 h-full transition-colors',
              active ? 'text-primary-900' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <item.icon size={20} strokeWidth={active ? 2.25 : 1.75} />
            <span className="text-[10px] font-medium leading-none truncate max-w-full">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNav;

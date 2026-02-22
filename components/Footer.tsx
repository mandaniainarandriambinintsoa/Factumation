import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Github, Twitter } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import { useLocalizedPath } from '../hooks/useLocalizedPath';

const Footer: React.FC = () => {
  const { t } = useI18n();
  const { path } = useLocalizedPath();

  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-slate-500 text-sm">
            © {new Date().getFullYear()} Factumation. {t('common.allRightsReserved')}
          </div>

          <div className="flex items-center space-x-6">
            <Link to={path('/blog')} className="text-sm text-slate-500 hover:text-primary-900 transition-colors">
              {t('nav.blog')}
            </Link>
            <a href="#" className="text-slate-400 hover:text-primary-900 transition-colors">
              <Twitter size={20} />
            </a>
            <a href="#" className="text-slate-400 hover:text-primary-900 transition-colors">
              <Github size={20} />
            </a>
            <Link to={path('/contact')} className="text-slate-400 hover:text-primary-900 transition-colors">
              <Mail size={20} />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

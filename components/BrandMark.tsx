import React from 'react';
import { Link } from 'react-router-dom';

import { useLocalizedPath } from '../hooks/useLocalizedPath';

interface BrandMarkProps {
  compact?: boolean;
  className?: string;
  onClick?: () => void;
}

const BrandMark: React.FC<BrandMarkProps> = ({ compact = false, className = '', onClick }) => {
  const { path } = useLocalizedPath();

  return (
    <Link
      to={path('/')}
      className={`group inline-flex shrink-0 items-center ${className}`}
      onClick={onClick}
      aria-label="Factumation, accueil"
    >
      <img
        src="/brand/factumation-logo.svg"
        alt="Factumation"
        width={1230}
        height={285}
        className={`${compact ? 'h-7' : 'h-8 sm:h-9'} w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]`}
      />
    </Link>
  );
};

export default BrandMark;

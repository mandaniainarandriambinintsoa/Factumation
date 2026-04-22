import * as React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, startIcon, endIcon, ...props }, ref) => {
    const inputEl = (
      <input
        type={type}
        ref={ref}
        className={cn(
          'flex h-10 w-full rounded-lg border border-slate-300 bg-white py-2 text-sm text-slate-900',
          'placeholder:text-slate-400',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-slate-700',
          'focus-visible:outline-none focus-visible:border-primary-500 focus-visible:ring-2 focus-visible:ring-primary-500/20',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50',
          'transition-colors',
          startIcon ? 'pl-10' : 'px-3',
          endIcon ? 'pr-10' : startIcon ? 'pr-3' : '',
          className
        )}
        {...props}
      />
    );

    if (!startIcon && !endIcon) return inputEl;

    return (
      <div className="relative">
        {startIcon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 [&_svg]:h-4 [&_svg]:w-4">
            {startIcon}
          </span>
        )}
        {inputEl}
        {endIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 [&_svg]:h-4 [&_svg]:w-4">
            {endIcon}
          </span>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };

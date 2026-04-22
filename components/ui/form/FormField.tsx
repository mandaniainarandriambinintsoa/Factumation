import * as React from 'react';
import { cn } from '../../../lib/utils';

interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: React.ReactNode;
  htmlFor?: string;
  error?: string;
  hint?: React.ReactNode;
  required?: boolean;
}

/**
 * Wrapper de champ standard : label + control + hint + error message
 * Utilisé par les atoms FieldText, FieldNumber, etc.
 */
export const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, label, htmlFor, error, hint, required, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('flex flex-col gap-1.5', className)} {...props}>
        {label && (
          <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        {children}
        {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);
FormField.displayName = 'FormField';

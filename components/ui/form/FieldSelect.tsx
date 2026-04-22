import * as React from 'react';
import {
  useFormContext,
  Controller,
  type FieldValues,
  type FieldPath,
} from 'react-hook-form';
import { cn } from '../../../lib/utils';
import { FormField } from './FormField';

interface Option {
  value: string;
  label: string;
}

interface FieldSelectProps<T extends FieldValues>
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'name'> {
  name: FieldPath<T>;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  required?: boolean;
  options: Option[];
  placeholder?: string;
}

/**
 * Select HTML natif stylé — simple et léger. Pour des selects custom avec search/group,
 * utiliser un vrai composant Radix Select (à ajouter plus tard si besoin).
 */
export function FieldSelect<T extends FieldValues>({
  name,
  label,
  hint,
  required,
  options,
  placeholder,
  className,
  ...selectProps
}: FieldSelectProps<T>) {
  const { control } = useFormContext<T>();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormField
          label={label}
          htmlFor={name}
          error={fieldState.error?.message}
          hint={hint}
          required={required}
        >
          <select
            id={name}
            {...field}
            value={field.value ?? ''}
            className={cn(
              'flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900',
              'focus-visible:outline-none focus-visible:border-primary-500 focus-visible:ring-2 focus-visible:ring-primary-500/20',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50',
              'transition-colors',
              className
            )}
            {...selectProps}
          >
            {placeholder && <option value="" disabled>{placeholder}</option>}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FormField>
      )}
    />
  );
}

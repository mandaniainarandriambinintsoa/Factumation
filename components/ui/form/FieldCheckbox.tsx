import * as React from 'react';
import {
  useFormContext,
  Controller,
  type FieldValues,
  type FieldPath,
} from 'react-hook-form';
import { cn } from '../../../lib/utils';

interface FieldCheckboxProps<T extends FieldValues> {
  name: FieldPath<T>;
  label: React.ReactNode;
  hint?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function FieldCheckbox<T extends FieldValues>({
  name,
  label,
  hint,
  disabled,
  className,
}: FieldCheckboxProps<T>) {
  const { control } = useFormContext<T>();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <div className={cn('flex flex-col gap-1', className)}>
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={!!field.value}
              onChange={(e) => field.onChange(e.target.checked)}
              disabled={disabled}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500/20 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm text-slate-700 leading-snug">{label}</span>
              {hint && !fieldState.error && (
                <span className="text-xs text-slate-500">{hint}</span>
              )}
            </div>
          </label>
          {fieldState.error?.message && (
            <p className="text-xs text-red-600 pl-6">{fieldState.error.message}</p>
          )}
        </div>
      )}
    />
  );
}

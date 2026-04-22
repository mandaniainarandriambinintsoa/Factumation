import * as React from 'react';
import {
  useFormContext,
  Controller,
  type FieldValues,
  type FieldPath,
} from 'react-hook-form';
import { Input, type InputProps } from '../input';
import { FormField } from './FormField';

interface FieldNumberProps<T extends FieldValues> extends Omit<InputProps, 'name' | 'type'> {
  name: FieldPath<T>;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  required?: boolean;
}

export function FieldNumber<T extends FieldValues>({
  name,
  label,
  hint,
  required,
  ...inputProps
}: FieldNumberProps<T>) {
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
          <Input
            id={name}
            type="number"
            inputMode="numeric"
            {...field}
            value={field.value ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              field.onChange(v === '' ? undefined : Number(v));
            }}
            {...inputProps}
          />
        </FormField>
      )}
    />
  );
}

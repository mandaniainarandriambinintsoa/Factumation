import * as React from 'react';
import {
  useFormContext,
  Controller,
  type FieldValues,
  type FieldPath,
} from 'react-hook-form';
import { Input, type InputProps } from '../input';
import { FormField } from './FormField';

interface FieldTextProps<T extends FieldValues> extends Omit<InputProps, 'name'> {
  name: FieldPath<T>;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  required?: boolean;
}

/**
 * Input texte connecté à react-hook-form via useFormContext.
 * À utiliser à l'intérieur d'un <FormProvider>.
 */
export function FieldText<T extends FieldValues>({
  name,
  label,
  hint,
  required,
  ...inputProps
}: FieldTextProps<T>) {
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
            {...field}
            value={field.value ?? ''}
            {...inputProps}
          />
        </FormField>
      )}
    />
  );
}

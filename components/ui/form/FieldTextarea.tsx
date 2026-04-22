import * as React from 'react';
import {
  useFormContext,
  Controller,
  type FieldValues,
  type FieldPath,
} from 'react-hook-form';
import { Textarea, type TextareaProps } from '../textarea';
import { FormField } from './FormField';

interface FieldTextareaProps<T extends FieldValues>
  extends Omit<TextareaProps, 'name'> {
  name: FieldPath<T>;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  required?: boolean;
}

export function FieldTextarea<T extends FieldValues>({
  name,
  label,
  hint,
  required,
  ...textareaProps
}: FieldTextareaProps<T>) {
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
          <Textarea
            id={name}
            {...field}
            value={field.value ?? ''}
            {...textareaProps}
          />
        </FormField>
      )}
    />
  );
}

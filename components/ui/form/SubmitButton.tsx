import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { Button, type ButtonProps } from '../button';

interface SubmitButtonProps extends ButtonProps {
  loadingText?: React.ReactNode;
}

/**
 * Bouton submit qui affiche automatiquement un spinner pendant formState.isSubmitting.
 * À utiliser à l'intérieur d'un <FormProvider>.
 */
export const SubmitButton = React.forwardRef<HTMLButtonElement, SubmitButtonProps>(
  ({ children, loadingText, disabled, ...props }, ref) => {
    const { formState } = useFormContext();
    const isSubmitting = formState.isSubmitting;

    return (
      <Button
        ref={ref}
        type="submit"
        disabled={disabled || isSubmitting}
        {...props}
      >
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {isSubmitting && loadingText ? loadingText : children}
      </Button>
    );
  }
);
SubmitButton.displayName = 'SubmitButton';

import React, { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User as UserIcon, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { FieldText } from './ui/form/FieldText';
import { SubmitButton } from './ui/form/SubmitButton';
import { toast } from './ui/toaster';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  customMessage?: string;
}

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Minimum 6 caractères'),
});

const registerSchema = loginSchema.extend({
  name: z.string().optional(),
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  customMessage,
}) => {
  const [mode, setMode] = React.useState<'login' | 'register'>(initialMode);
  const { signIn, signUp, signInWithGoogle, error, clearError, isConfigured } = useAuth();
  const { t } = useI18n();

  const form = useForm<RegisterValues>({
    resolver: zodResolver(mode === 'register' ? registerSchema : loginSchema),
    defaultValues: { email: '', password: '', name: '' },
  });

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      form.reset({ email: '', password: '', name: '' });
      clearError();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleSubmit = form.handleSubmit(async (values) => {
    if (mode === 'login') {
      const result = await signIn(values.email, values.password);
      if (!result.error) {
        toast.success(t('auth.loginSuccess') || 'Connexion réussie');
        onClose();
      }
    } else {
      const result = await signUp(values.email, values.password, values.name);
      if (!result.error) {
        toast.success(t('auth.accountCreated'));
        form.reset();
      }
    }
  });

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    form.clearErrors();
    clearError();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <div className="p-8">
          <DialogHeader className="text-center items-center space-y-2 mb-6">
            <DialogTitle className="text-2xl font-bold">
              {mode === 'login' ? t('auth.loginTitle') : t('auth.registerTitle')}
            </DialogTitle>
            {customMessage ? (
              <div className="w-full p-3 bg-primary-50 border border-primary-100 rounded-lg">
                <p className="text-sm text-primary-800 font-medium">{customMessage}</p>
              </div>
            ) : (
              <DialogDescription className="text-center">
                {mode === 'login' ? t('auth.loginSubtitle') : t('auth.registerSubtitle')}
              </DialogDescription>
            )}
          </DialogHeader>

          {!isConfigured && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-800">{t('auth.notConfigured')}</p>
              </div>
            </div>
          )}

          {/* Google Sign In */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 gap-3"
            onClick={() => signInWithGoogle()}
            disabled={!isConfigured}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {t('auth.continueGoogle')}
          </Button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">{t('auth.or')}</span>
            </div>
          </div>

          {/* Form */}
          <FormProvider {...form}>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <FieldText<RegisterValues>
                  name="name"
                  label={t('auth.fullName')}
                  placeholder={t('auth.namePlaceholder')}
                  startIcon={<UserIcon />}
                />
              )}

              <FieldText<RegisterValues>
                name="email"
                type="email"
                label={t('auth.emailLabel')}
                placeholder={t('auth.emailPlaceholder')}
                startIcon={<Mail />}
                required
                autoComplete="email"
              />

              <FieldText<RegisterValues>
                name="password"
                type="password"
                label={t('auth.passwordLabel')}
                placeholder="••••••••"
                startIcon={<Lock />}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />

              <SubmitButton
                variant="primary"
                className="w-full h-11"
                disabled={!isConfigured}
                loadingText={t('auth.loading')}
              >
                {mode === 'login' ? t('auth.loginButton') : t('auth.registerButton')}
              </SubmitButton>
            </form>
          </FormProvider>

          {/* Toggle mode */}
          <p className="mt-6 text-center text-sm text-slate-600">
            {mode === 'login' ? (
              <>
                {t('auth.noAccount')}{' '}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="font-medium text-primary-700 hover:text-primary-900"
                >
                  {t('auth.registerLink')}
                </button>
              </>
            ) : (
              <>
                {t('auth.hasAccount')}{' '}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="font-medium text-primary-700 hover:text-primary-900"
                >
                  {t('auth.loginLink')}
                </button>
              </>
            )}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;

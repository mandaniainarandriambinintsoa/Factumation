import { Toaster as SonnerToaster, toast } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            'bg-white border border-slate-200 text-slate-800 shadow-elevated rounded-lg',
          title: 'text-slate-900 font-semibold',
          description: 'text-slate-600',
          success:
            '!bg-emerald-50 !border-emerald-200 !text-emerald-900',
          error:
            '!bg-red-50 !border-red-200 !text-red-900',
          info:
            '!bg-primary-50 !border-primary-200 !text-primary-900',
          warning:
            '!bg-amber-50 !border-amber-200 !text-amber-900',
        },
      }}
    />
  );
}

export { toast };

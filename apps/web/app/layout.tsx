import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';

import { ServiceWorkerRegistration } from '@/components/service-worker-registration';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://factumation.manda-ia.com'),
  title: { default: 'Factumation', template: '%s — Factumation' },
  description: 'Créez et pilotez vos factures et devis avec clarté.',
  manifest: '/manifest.webmanifest',
  applicationName: 'Factumation',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Factumation' },
  icons: { icon: '/icons/icon.svg' },
};

const sans = Inter({ subsets: ['latin'], variable: '--font-sans' });

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="fr" className={sans.variable}>
      <body>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}

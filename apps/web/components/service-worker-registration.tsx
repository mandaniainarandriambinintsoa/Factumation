'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || process.env.NODE_ENV !== 'production') return;
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((error: unknown) => {
      console.error('Service worker registration failed.', error);
    });
  }, []);
  return null;
}

export async function clearLocalUserData(): Promise<void> {
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (key?.startsWith('factumation-document-draft-v1')) localStorage.removeItem(key);
  }
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready.catch(() => null);
    registration?.active?.postMessage({ type: 'CLEAR_USER_DATA' });
  }
}

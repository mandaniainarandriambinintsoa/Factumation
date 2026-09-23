'use client';

import { useEffect } from 'react';

import { createClient } from '@/lib/supabase/client';
import { OUTBOX_CHANGED_EVENT, synchronizeDocumentOutbox } from '@/lib/offline/document-sync';
import { clearOfflineStorage } from '@/lib/offline/offline-storage';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    let disposed = false;
    const synchronize = async () => {
      if (disposed || !navigator.onLine) return;
      try {
        const { data } = await createClient().auth.getSession();
        const ownerId = data.session?.user.id;
        if (ownerId) await synchronizeDocumentOutbox(ownerId);
      } catch (error) {
        console.error('Document outbox synchronization failed.', error);
      }
    };
    const handleWorkerMessage = (event: MessageEvent<{ type?: string }>) => {
      if (event.data?.type === 'SYNC_OUTBOX') void synchronize();
    };
    window.addEventListener('online', synchronize);
    window.addEventListener(OUTBOX_CHANGED_EVENT, synchronize);
    document.addEventListener('visibilitychange', synchronize);
    const retryInterval = window.setInterval(() => void synchronize(), 60_000);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleWorkerMessage);
      if (process.env.NODE_ENV === 'production') {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/', updateViaCache: 'none' })
          .then(() => synchronize())
          .catch((error: unknown) => console.error('Service worker registration failed.', error));
      } else {
        void synchronize();
      }
    } else {
      void synchronize();
    }
    return () => {
      disposed = true;
      window.removeEventListener('online', synchronize);
      window.removeEventListener(OUTBOX_CHANGED_EVENT, synchronize);
      document.removeEventListener('visibilitychange', synchronize);
      window.clearInterval(retryInterval);
      navigator.serviceWorker?.removeEventListener('message', handleWorkerMessage);
    };
  }, []);
  return null;
}

export async function clearLocalUserData(): Promise<void> {
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (key?.startsWith('factumation-document-draft-')) localStorage.removeItem(key);
  }
  await clearOfflineStorage().catch((error: unknown) => {
    console.error('Encrypted local data cleanup failed.', error);
  });
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready.catch(() => null);
    registration?.active?.postMessage({ type: 'CLEAR_USER_DATA' });
  }
}

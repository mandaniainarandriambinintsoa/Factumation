'use client';

import type { Invoice, Quote } from '@/lib/api/types';
import { browserApiRequest, BrowserApiError } from '@/lib/api/browser-api';

import {
  deleteDocumentJob,
  deleteEncryptedDraft,
  listDocumentJobs,
  type OfflineDocumentJob,
  updateDocumentJobFailure,
} from './offline-storage';
import { isRetryableSyncStatus } from './sync-policy';

export const OUTBOX_CHANGED_EVENT = 'factumation:outbox-changed';
export const OUTBOX_RESULT_EVENT = 'factumation:outbox-result';

export type OutboxResult = {
  jobId: string;
  kind: OfflineDocumentJob['kind'];
  action: OfflineDocumentJob['action'];
  status: 'synced' | 'blocked';
  documentId?: string;
  message?: string;
};

let fallbackSynchronization: Promise<void> | null = null;

function collectionFor(job: OfflineDocumentJob): 'invoices' | 'quotes' {
  return job.kind === 'invoice' ? 'invoices' : 'quotes';
}

async function processJob(job: OfflineDocumentJob): Promise<string> {
  const collection = collectionFor(job);
  let document = await browserApiRequest<Invoice | Quote>(`/${collection}`, {
    method: 'POST',
    headers: { 'Idempotency-Key': job.idempotencyKey },
    body: JSON.stringify(job.payload),
  });
  if (job.action !== 'draft' && document.status === 'draft') {
    document = await browserApiRequest<Invoice | Quote>(`/${collection}/${document.id}/issue`, {
      method: 'POST',
    });
  }
  if (job.action === 'send' && document.status === 'issued') {
    document = await browserApiRequest<Invoice | Quote>(`/${collection}/${document.id}/send`, {
      method: 'POST',
    });
  }
  return document.id;
}

function emitResult(detail: OutboxResult): void {
  window.dispatchEvent(new CustomEvent<OutboxResult>(OUTBOX_RESULT_EVENT, { detail }));
}

async function synchronize(ownerId: string): Promise<void> {
  if (!navigator.onLine) return;
  const jobs = await listDocumentJobs(ownerId);
  for (const job of jobs) {
    if (Date.parse(job.nextAttemptAt) > Date.now()) continue;
    try {
      const documentId = await processJob(job);
      await Promise.all([deleteDocumentJob(job.id), deleteEncryptedDraft(job.ownerId, job.kind)]);
      emitResult({
        jobId: job.id,
        kind: job.kind,
        action: job.action,
        status: 'synced',
        documentId,
      });
    } catch (error) {
      const apiError = error instanceof BrowserApiError ? error : null;
      const retryable = isRetryableSyncStatus(apiError?.status ?? null);
      const message = apiError?.message ?? 'La synchronisation a échoué.';
      await updateDocumentJobFailure(job.id, message, !retryable);
      if (!retryable) {
        emitResult({
          jobId: job.id,
          kind: job.kind,
          action: job.action,
          status: 'blocked',
          message,
        });
      }
      if (apiError?.status === 401 || retryable) break;
    }
  }
}

export async function synchronizeDocumentOutbox(ownerId: string): Promise<void> {
  if ('locks' in navigator) {
    await navigator.locks.request(
      'factumation-document-outbox',
      { ifAvailable: true },
      async (lock) => {
        if (lock) await synchronize(ownerId);
      },
    );
    return;
  }
  fallbackSynchronization ??= synchronize(ownerId).finally(() => {
    fallbackSynchronization = null;
  });
  await fallbackSynchronization;
}

export async function requestDocumentSync(): Promise<void> {
  window.dispatchEvent(new Event(OUTBOX_CHANGED_EVENT));
  if (!('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.ready.catch(() => null);
  if (!registration || !('sync' in registration)) return;
  const syncRegistration = registration as ServiceWorkerRegistration & {
    sync: { register(tag: string): Promise<void> };
  };
  await syncRegistration.sync.register('factumation-document-outbox').catch(() => undefined);
}

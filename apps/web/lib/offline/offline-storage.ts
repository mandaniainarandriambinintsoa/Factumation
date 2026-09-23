'use client';

import { nextSyncDelayMs } from './sync-policy';

export type OfflineDocumentKind = 'invoice' | 'quote';
export type OfflineDocumentAction = 'draft' | 'issue' | 'pdf' | 'send';

export type OfflineDocumentJob = {
  id: string;
  ownerId: string;
  kind: OfflineDocumentKind;
  action: OfflineDocumentAction;
  locale: string;
  idempotencyKey: string;
  payload: unknown;
  createdAt: string;
  attempts: number;
  nextAttemptAt: string;
  lastError: string | null;
  blocked: boolean;
};

type EncryptedValue = {
  version: 1;
  iv: ArrayBuffer;
  ciphertext: ArrayBuffer;
};

type DraftRecord = {
  id: string;
  ownerId: string;
  kind: OfflineDocumentKind;
  savedAt: string;
  expiresAt: string;
  encrypted: EncryptedValue;
};

type OutboxRecord = Omit<OfflineDocumentJob, 'payload'> & {
  encrypted: EncryptedValue;
};

const DATABASE_NAME = 'factumation-private-v1';
const DATABASE_VERSION = 1;
const KEY_ID = 'device-aes-gcm-v1';
const MAX_OUTBOX_ITEMS = 25;
const RECORD_TTL_MS = 30 * 24 * 60 * 60 * 1_000;

let databasePromise: Promise<IDBDatabase> | null = null;

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () =>
      reject(transaction.error ?? new Error('IndexedDB transaction aborted.'));
    transaction.onerror = () =>
      reject(transaction.error ?? new Error('IndexedDB transaction failed.'));
  });
}

function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise;
  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      database.createObjectStore('keys', { keyPath: 'id' });
      const drafts = database.createObjectStore('drafts', { keyPath: 'id' });
      drafts.createIndex('ownerId', 'ownerId');
      const outbox = database.createObjectStore('outbox', { keyPath: 'id' });
      outbox.createIndex('ownerId', 'ownerId');
    };
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = () => {
      databasePromise = null;
      reject(request.error ?? new Error('Unable to open encrypted local storage.'));
    };
  });
  return databasePromise;
}

async function getEncryptionKey(): Promise<CryptoKey> {
  const database = await openDatabase();
  const existingTransaction = database.transaction('keys', 'readonly');
  const existing = (await requestResult(existingTransaction.objectStore('keys').get(KEY_ID))) as
    { id: string; key: CryptoKey } | undefined;
  await transactionDone(existingTransaction);
  if (existing?.key) return existing.key;

  const candidate = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, [
    'encrypt',
    'decrypt',
  ]);
  const transaction = database.transaction('keys', 'readwrite');
  const store = transaction.objectStore('keys');
  const current = (await requestResult(store.get(KEY_ID))) as
    { id: string; key: CryptoKey } | undefined;
  if (!current) store.put({ id: KEY_ID, key: candidate });
  await transactionDone(transaction);
  return current?.key ?? candidate;
}

function associatedData(recordId: string): Uint8Array<ArrayBuffer> {
  const encoded = new TextEncoder().encode(`factumation:v1:${recordId}`);
  const buffer = new ArrayBuffer(encoded.byteLength);
  const bytes = new Uint8Array(buffer);
  bytes.set(encoded);
  return bytes;
}

async function encryptJson(recordId: string, value: unknown): Promise<EncryptedValue> {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(value));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: associatedData(recordId) },
    key,
    plaintext,
  );
  return {
    version: 1,
    iv: iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength),
    ciphertext,
  };
}

async function decryptJson<T>(recordId: string, value: EncryptedValue): Promise<T> {
  if (value.version !== 1) throw new Error('Unsupported encrypted record version.');
  const key = await getEncryptionKey();
  const plaintext = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(value.iv),
      additionalData: associatedData(recordId),
    },
    key,
    value.ciphertext,
  );
  return JSON.parse(new TextDecoder().decode(plaintext)) as T;
}

function draftId(ownerId: string, kind: OfflineDocumentKind): string {
  return `${ownerId}:${kind}`;
}

export async function saveEncryptedDraft(
  ownerId: string,
  kind: OfflineDocumentKind,
  values: unknown,
): Promise<void> {
  const database = await openDatabase();
  const id = draftId(ownerId, kind);
  const now = Date.now();
  const record: DraftRecord = {
    id,
    ownerId,
    kind,
    savedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + RECORD_TTL_MS).toISOString(),
    encrypted: await encryptJson(id, values),
  };
  const transaction = database.transaction('drafts', 'readwrite');
  transaction.objectStore('drafts').put(record);
  await transactionDone(transaction);
}

export async function readEncryptedDraft<T>(
  ownerId: string,
  kind: OfflineDocumentKind,
): Promise<T | null> {
  const database = await openDatabase();
  const id = draftId(ownerId, kind);
  const transaction = database.transaction('drafts', 'readonly');
  const record = (await requestResult(transaction.objectStore('drafts').get(id))) as
    DraftRecord | undefined;
  await transactionDone(transaction);
  if (!record) return null;
  if (Date.parse(record.expiresAt) <= Date.now()) {
    await deleteEncryptedDraft(ownerId, kind);
    return null;
  }
  return decryptJson<T>(id, record.encrypted);
}

export async function deleteEncryptedDraft(
  ownerId: string,
  kind: OfflineDocumentKind,
): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction('drafts', 'readwrite');
  transaction.objectStore('drafts').delete(draftId(ownerId, kind));
  await transactionDone(transaction);
}

export async function enqueueDocumentJob(
  input: Omit<
    OfflineDocumentJob,
    'id' | 'createdAt' | 'attempts' | 'nextAttemptAt' | 'lastError' | 'blocked'
  >,
): Promise<OfflineDocumentJob> {
  const existing = await listDocumentJobs(input.ownerId, { includeBlocked: true });
  if (existing.length >= MAX_OUTBOX_ITEMS) {
    throw new Error('La file hors connexion est pleine. Reconnectez-vous avant de continuer.');
  }
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const job: OfflineDocumentJob = {
    ...input,
    id,
    createdAt: now,
    attempts: 0,
    nextAttemptAt: now,
    lastError: null,
    blocked: false,
  };
  const database = await openDatabase();
  const record: OutboxRecord = {
    id: job.id,
    ownerId: job.ownerId,
    kind: job.kind,
    action: job.action,
    locale: job.locale,
    idempotencyKey: job.idempotencyKey,
    createdAt: job.createdAt,
    attempts: job.attempts,
    nextAttemptAt: job.nextAttemptAt,
    lastError: job.lastError,
    blocked: job.blocked,
    encrypted: await encryptJson(id, job.payload),
  };
  const transaction = database.transaction('outbox', 'readwrite');
  transaction.objectStore('outbox').put(record);
  await transactionDone(transaction);
  return job;
}

export async function listDocumentJobs(
  ownerId: string,
  options: { includeBlocked?: boolean } = {},
): Promise<OfflineDocumentJob[]> {
  const database = await openDatabase();
  const transaction = database.transaction('outbox', 'readonly');
  const records = (await requestResult(
    transaction.objectStore('outbox').index('ownerId').getAll(ownerId),
  )) as OutboxRecord[];
  await transactionDone(transaction);
  const expiredIds = records
    .filter((record) => Date.parse(record.createdAt) + RECORD_TTL_MS <= Date.now())
    .map((record) => record.id);
  if (expiredIds.length) {
    const cleanup = database.transaction('outbox', 'readwrite');
    for (const id of expiredIds) cleanup.objectStore('outbox').delete(id);
    await transactionDone(cleanup);
  }
  const active = records
    .filter((record) => Date.parse(record.createdAt) + RECORD_TTL_MS > Date.now())
    .filter((record) => options.includeBlocked || !record.blocked)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  return Promise.all(
    active.map(async (record) => ({
      id: record.id,
      ownerId: record.ownerId,
      kind: record.kind,
      action: record.action,
      locale: record.locale,
      idempotencyKey: record.idempotencyKey,
      payload: await decryptJson(record.id, record.encrypted),
      createdAt: record.createdAt,
      attempts: record.attempts,
      nextAttemptAt: record.nextAttemptAt,
      lastError: record.lastError,
      blocked: record.blocked,
    })),
  );
}

export async function updateDocumentJobFailure(
  id: string,
  error: string,
  blocked: boolean,
): Promise<void> {
  const database = await openDatabase();
  const readTransaction = database.transaction('outbox', 'readonly');
  const record = (await requestResult(readTransaction.objectStore('outbox').get(id))) as
    OutboxRecord | undefined;
  await transactionDone(readTransaction);
  if (!record) return;
  const attempts = record.attempts + 1;
  const delayMs = nextSyncDelayMs(attempts);
  const updated: OutboxRecord = {
    ...record,
    attempts,
    lastError: error.slice(0, 300),
    blocked,
    nextAttemptAt: new Date(Date.now() + delayMs).toISOString(),
  };
  const writeTransaction = database.transaction('outbox', 'readwrite');
  writeTransaction.objectStore('outbox').put(updated);
  await transactionDone(writeTransaction);
}

export async function deleteDocumentJob(id: string): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction('outbox', 'readwrite');
  transaction.objectStore('outbox').delete(id);
  await transactionDone(transaction);
}

export async function clearOfflineStorage(): Promise<void> {
  if (databasePromise) {
    const database = await databasePromise.catch(() => null);
    database?.close();
    databasePromise = null;
  }
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DATABASE_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error('Unable to clear local storage.'));
    request.onblocked = () => reject(new Error('Local storage cleanup is blocked by another tab.'));
  });
}

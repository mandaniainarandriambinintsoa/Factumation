import { describe, expect, it } from 'vitest';

import { isRetryableSyncStatus, nextSyncDelayMs } from '../apps/web/lib/offline/sync-policy';

describe('offline document sync policy', () => {
  it.each([null, 0, 401, 429, 500, 503])('retries transient status %s', (status) => {
    expect(isRetryableSyncStatus(status)).toBe(true);
  });

  it.each([400, 403, 409, 422])('blocks permanent status %s', (status) => {
    expect(isRetryableSyncStatus(status)).toBe(false);
  });

  it('uses bounded exponential backoff', () => {
    expect(nextSyncDelayMs(1)).toBe(5_000);
    expect(nextSyncDelayMs(2)).toBe(10_000);
    expect(nextSyncDelayMs(20)).toBe(1_280_000);
  });
});

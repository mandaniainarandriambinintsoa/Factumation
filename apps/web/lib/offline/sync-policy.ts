export function isRetryableSyncStatus(status: number | null): boolean {
  return status === null || status === 0 || status === 401 || status === 429 || status >= 500;
}

export function nextSyncDelayMs(attempts: number): number {
  const normalizedAttempts = Math.max(1, Math.floor(attempts));
  return Math.min(60 * 60 * 1_000, 5_000 * 2 ** Math.min(normalizedAttempts - 1, 8));
}

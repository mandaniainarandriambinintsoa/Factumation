export class DataAccessError extends Error {
  constructor(
    operation: string,
    readonly code?: string,
  ) {
    super(`Data access failed during ${operation}${code ? ` (${code})` : ''}.`);
    this.name = 'DataAccessError';
  }
}

export type LegacyDocumentPrefix = 'INV' | 'DEV' | string;

/**
 * Reproduces the browser-side legacy number format for compatibility tests only.
 * This is not collision-safe and must be replaced by the transactional backend allocator.
 */
export const createLegacyDocumentNumber = (
  prefix: LegacyDocumentPrefix,
  date = new Date(),
  random = Math.random,
): string => {
  const suffix = Math.floor(random() * 1000)
    .toString()
    .padStart(3, '0');

  return `${prefix}-${date.getFullYear()}-${suffix}`;
};

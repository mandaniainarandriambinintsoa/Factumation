export const PHONE_PATTERN = /^\+?[\d\s\-().]{8,20}$/;
export const VAT_NUMBER_PATTERN = /^FR[0-9A-Z]{2}\d{9}$/i;
export const NIF_PATTERN = /^[\d\s-]{5,20}$/;
export const STAT_PATTERN = /^[\p{L}\p{N}\s_-]{5,30}$/u;
export const SAFE_SEARCH_PATTERN = /^[\p{L}\p{N}\s@.'’_+&-]+$/u;

export function isValidSiret(value: string): boolean {
  const siret = value.replace(/\s/g, '');
  if (!/^\d{14}$/.test(siret)) return false;

  let sum = 0;
  for (let index = 0; index < siret.length; index += 1) {
    let digit = Number(siret[index]);
    if (index % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

export function escapePostgrestLikePattern(value: string): string {
  return value.replace(/[%_*]/g, (character) => `\\${character}`);
}

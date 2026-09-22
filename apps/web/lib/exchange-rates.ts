import type { SupportedCurrency } from '@factumation/domain';

const CACHE_KEY = 'factumation-exchange-rates-v2';
const CACHE_TTL_MS = 24 * 60 * 60 * 1_000;
const REQUEST_TIMEOUT_MS = 8_000;

export type ExchangeRateTable = {
  baseCurrency: 'EUR';
  rates: Record<string, number>;
  date: string;
  fetchedAt: number;
};

function containsCurrencies(table: ExchangeRateTable, currencies: readonly string[]): boolean {
  return currencies.every(
    (currency) => currency === 'EUR' || Number.isFinite(table.rates[currency]),
  );
}

function readCache(): ExchangeRateTable | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as ExchangeRateTable;
    if (value.baseCurrency !== 'EUR' || !value.rates || !Number.isFinite(value.fetchedAt)) {
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

function writeCache(table: ExchangeRateTable): void {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(table));
  } catch {
    // Conversion remains available when browser storage is disabled or full.
  }
}

export async function getExchangeRates(
  currencies: readonly SupportedCurrency[],
  signal?: AbortSignal,
): Promise<ExchangeRateTable> {
  const required = [...new Set(currencies)];
  const cached = readCache();
  if (
    cached &&
    Date.now() - cached.fetchedAt < CACHE_TTL_MS &&
    containsCurrencies(cached, required)
  ) {
    return cached;
  }

  const timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const requestSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;
  try {
    const query = new URLSearchParams({ currencies: required.join(',') });
    const response = await fetch(`/api/exchange-rates?${query}`, {
      headers: { Accept: 'application/json' },
      signal: requestSignal,
    });
    if (!response.ok) throw new Error(`Exchange rate API returned ${response.status}.`);
    const result = (await response.json()) as Omit<ExchangeRateTable, 'fetchedAt'>;
    const table: ExchangeRateTable = { ...result, fetchedAt: Date.now() };
    if (!containsCurrencies(table, required)) {
      throw new Error('The exchange-rate response is incomplete.');
    }
    writeCache(table);
    return table;
  } catch (error) {
    // A stale complete table is safer than adding amounts expressed in different currencies.
    if (cached && containsCurrencies(cached, required)) return cached;
    throw error;
  }
}

export function convertCurrency(
  amount: number,
  sourceCurrency: SupportedCurrency,
  targetCurrency: SupportedCurrency,
  table: ExchangeRateTable,
): number {
  if (sourceCurrency === targetCurrency) return amount;
  const sourcePerEuro = sourceCurrency === 'EUR' ? 1 : table.rates[sourceCurrency];
  const targetPerEuro = targetCurrency === 'EUR' ? 1 : table.rates[targetCurrency];
  if (
    typeof sourcePerEuro !== 'number' ||
    !Number.isFinite(sourcePerEuro) ||
    typeof targetPerEuro !== 'number' ||
    !Number.isFinite(targetPerEuro)
  ) {
    throw new Error(`Missing exchange rate for ${sourceCurrency} or ${targetCurrency}.`);
  }
  return (amount / sourcePerEuro) * targetPerEuro;
}

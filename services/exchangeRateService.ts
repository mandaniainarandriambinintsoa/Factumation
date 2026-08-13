const API_URL = 'https://api.frankfurter.dev/v2/rates';
const PIVOT_CURRENCY = 'EUR';
const CACHE_KEY = 'factumation-exchange-rates-v1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 8_000;

type ApiRate = {
  date: string;
  base: string;
  quote: string;
  rate: number;
};

export type ExchangeRateTable = {
  baseCurrency: typeof PIVOT_CURRENCY;
  rates: Record<string, number>;
  date: string;
  fetchedAt: number;
};

const normalizeCurrency = (currency: string) => currency.trim().toUpperCase();

const readCache = (): ExchangeRateTable | null => {
  if (typeof window === 'undefined') return null;

  try {
    const rawCache = window.localStorage.getItem(CACHE_KEY);
    if (!rawCache) return null;

    const cache = JSON.parse(rawCache) as ExchangeRateTable;
    if (
      cache.baseCurrency !== PIVOT_CURRENCY
      || !cache.rates
      || typeof cache.fetchedAt !== 'number'
    ) {
      return null;
    }

    return cache;
  } catch {
    return null;
  }
};

const writeCache = (table: ExchangeRateTable) => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(table));
  } catch {
    // The conversion still works when storage is unavailable (private mode, quota, etc.).
  }
};

const containsCurrencies = (table: ExchangeRateTable, currencies: string[]) =>
  currencies.every((currency) => currency === PIVOT_CURRENCY || Number.isFinite(table.rates[currency]));

/**
 * Loads the latest exchange rates with EUR as a precise pivot currency.
 * Results are cached for one day because the public source updates daily.
 */
export const getExchangeRates = async (currencies: string[]): Promise<ExchangeRateTable> => {
  const normalizedCurrencies = [...new Set(currencies.map(normalizeCurrency))];
  const cached = readCache();
  const cacheIsFresh = cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS;

  if (cacheIsFresh && containsCurrencies(cached, normalizedCurrencies)) {
    return cached;
  }

  const quotes = normalizedCurrencies.filter((currency) => currency !== PIVOT_CURRENCY);
  if (quotes.length === 0) {
    return {
      baseCurrency: PIVOT_CURRENCY,
      rates: { [PIVOT_CURRENCY]: 1 },
      date: new Date().toISOString().slice(0, 10),
      fetchedAt: Date.now(),
    };
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const query = new URLSearchParams({
      base: PIVOT_CURRENCY,
      quotes: quotes.join(','),
    });
    const response = await fetch(`${API_URL}?${query}`, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(`Exchange rate API returned ${response.status}`);
    }

    const apiRates = await response.json() as ApiRate[];
    const rates = apiRates.reduce<Record<string, number>>(
      (result, item) => {
        const quote = normalizeCurrency(item.quote);
        if (Number.isFinite(item.rate) && item.rate > 0) result[quote] = item.rate;
        return result;
      },
      { [PIVOT_CURRENCY]: 1 },
    );

    const table: ExchangeRateTable = {
      baseCurrency: PIVOT_CURRENCY,
      rates,
      date: apiRates.map((item) => item.date).sort().at(-1) || new Date().toISOString().slice(0, 10),
      fetchedAt: Date.now(),
    };

    if (!containsCurrencies(table, normalizedCurrencies)) {
      throw new Error('One or more currencies are not supported by the exchange rate API');
    }

    writeCache(table);
    return table;
  } catch (error) {
    // A stale cached rate is safer than adding amounts from different currencies directly.
    if (cached && containsCurrencies(cached, normalizedCurrencies)) return cached;
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
};

export const convertCurrency = (
  amount: number,
  sourceCurrency: string,
  targetCurrency: string,
  table: ExchangeRateTable,
): number => {
  const source = normalizeCurrency(sourceCurrency);
  const target = normalizeCurrency(targetCurrency);
  if (source === target) return amount;

  const sourcePerEuro = table.rates[source];
  const targetPerEuro = table.rates[target];
  if (!Number.isFinite(sourcePerEuro) || !Number.isFinite(targetPerEuro)) {
    throw new Error(`Missing exchange rate for ${source} or ${target}`);
  }

  return (amount / sourcePerEuro) * targetPerEuro;
};

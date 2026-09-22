import { SUPPORTED_CURRENCIES, type SupportedCurrency } from '@factumation/domain';
import { NextResponse } from 'next/server';

const REQUEST_TIMEOUT_MS = 8_000;
const CACHE_CONTROL = 'public, s-maxage=21600, stale-while-revalidate=86400';

type FrankfurterRate = {
  date: string;
  quote: string;
  rate: number;
};

function requestedCurrencies(request: Request): SupportedCurrency[] | null {
  const values = new URL(request.url).searchParams
    .get('currencies')
    ?.split(',')
    .map((currency) => currency.trim().toUpperCase())
    .filter(Boolean);
  if (!values?.length) return null;
  const unique = [...new Set(values)];
  if (unique.some((currency) => !SUPPORTED_CURRENCIES.includes(currency as SupportedCurrency))) {
    return null;
  }
  return unique as SupportedCurrency[];
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    next: { revalidate: 21_600 },
  });
  if (!response.ok) throw new Error(`Rate provider returned ${response.status}.`);
  return response.json() as Promise<T>;
}

function success(rates: Record<string, number>, date: string, source: string): NextResponse {
  return NextResponse.json(
    { baseCurrency: 'EUR', rates: { EUR: 1, ...rates }, date, source },
    { headers: { 'Cache-Control': CACHE_CONTROL } },
  );
}

export async function GET(request: Request): Promise<NextResponse> {
  const currencies = requestedCurrencies(request);
  if (!currencies) {
    return NextResponse.json(
      { error: 'At least one supported currency is required.' },
      { status: 400 },
    );
  }
  const quotes = currencies.filter((currency) => currency !== 'EUR');
  if (!quotes.length) return success({}, new Date().toISOString().slice(0, 10), 'identity');

  try {
    const query = new URLSearchParams({ base: 'EUR', quotes: quotes.join(',') });
    const data = await fetchJson<FrankfurterRate[]>(
      `https://api.frankfurter.dev/v2/rates?${query}`,
    );
    const rates = Object.fromEntries(
      data
        .filter((item) => Number.isFinite(item.rate) && item.rate > 0)
        .map((item) => [item.quote.toUpperCase(), item.rate]),
    );
    if (!quotes.every((currency) => Number.isFinite(rates[currency]))) {
      throw new Error('Frankfurter response is incomplete.');
    }
    return success(
      rates,
      data
        .map((item) => item.date)
        .sort()
        .at(-1) ?? new Date().toISOString().slice(0, 10),
      'frankfurter',
    );
  } catch (primaryError) {
    try {
      const data = await fetchJson<{
        result: string;
        rates: Record<string, number>;
        time_last_update_utc?: string;
      }>('https://open.er-api.com/v6/latest/EUR');
      if (
        data.result !== 'success' ||
        !quotes.every((currency) => Number.isFinite(data.rates[currency]))
      ) {
        throw new Error('Fallback response is incomplete.', { cause: primaryError });
      }
      const rates = quotes.reduce<Record<string, number>>((result, currency) => {
        const rate = data.rates[currency];
        if (typeof rate === 'number') result[currency] = rate;
        return result;
      }, {});
      return success(
        rates,
        data.time_last_update_utc
          ? new Date(data.time_last_update_utc).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
        'exchange-rate-api',
      );
    } catch (fallbackError) {
      console.error('Exchange-rate providers unavailable.', { primaryError, fallbackError });
      return NextResponse.json(
        { error: 'Exchange rates are temporarily unavailable.' },
        { status: 503 },
      );
    }
  }
}

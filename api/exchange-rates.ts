type ApiRequest = {
  query?: Record<string, string | string[] | undefined>;
};

type ApiResponse = {
  status: (statusCode: number) => ApiResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

type FrankfurterRate = {
  date: string;
  quote: string;
  rate: number;
};

const SUPPORTED_CURRENCIES = new Set(['EUR', 'USD', 'GBP', 'CAD', 'CHF', 'MGA']);
const REQUEST_TIMEOUT_MS = 8_000;

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`Rate provider returned ${response.status}`);
  return response.json() as Promise<T>;
};

export default async function handler(request: ApiRequest, response: ApiResponse) {
  const rawCurrencies = Array.isArray(request.query?.currencies)
    ? request.query.currencies.join(',')
    : request.query?.currencies || '';
  const currencies = [...new Set(
    rawCurrencies
      .split(',')
      .map((currency) => currency.trim().toUpperCase())
      .filter((currency) => SUPPORTED_CURRENCIES.has(currency)),
  )];

  if (currencies.length === 0) {
    response.status(400).json({ error: 'At least one supported currency is required' });
    return;
  }

  const quotes = currencies.filter((currency) => currency !== 'EUR');
  response.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');

  if (quotes.length === 0) {
    response.status(200).json({
      baseCurrency: 'EUR',
      rates: { EUR: 1 },
      date: new Date().toISOString().slice(0, 10),
      source: 'frankfurter',
    });
    return;
  }

  try {
    const query = new URLSearchParams({ base: 'EUR', quotes: quotes.join(',') });
    const data = await fetchJson<FrankfurterRate[]>(`https://api.frankfurter.dev/v2/rates?${query}`);
    const rates = data.reduce<Record<string, number>>((result, item) => {
      if (Number.isFinite(item.rate) && item.rate > 0) result[item.quote] = item.rate;
      return result;
    }, { EUR: 1 });

    if (!quotes.every((currency) => Number.isFinite(rates[currency]))) {
      throw new Error('Frankfurter response is missing a currency');
    }

    response.status(200).json({
      baseCurrency: 'EUR',
      rates,
      date: data.map((item) => item.date).sort().at(-1),
      source: 'frankfurter',
    });
  } catch (primaryError) {
    try {
      const data = await fetchJson<{
        result: string;
        rates: Record<string, number>;
        time_last_update_utc?: string;
      }>('https://open.er-api.com/v6/latest/EUR');

      if (data.result !== 'success' || !quotes.every((currency) => Number.isFinite(data.rates[currency]))) {
        throw new Error('Fallback response is missing a currency');
      }

      response.status(200).json({
        baseCurrency: 'EUR',
        rates: Object.fromEntries([
          ['EUR', 1],
          ...quotes.map((currency) => [currency, data.rates[currency]]),
        ]),
        date: data.time_last_update_utc
          ? new Date(data.time_last_update_utc).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
        source: 'exchange-rate-api',
      });
    } catch (fallbackError) {
      console.error('Both exchange rate providers failed', { primaryError, fallbackError });
      response.status(503).json({ error: 'Exchange rates are temporarily unavailable' });
    }
  }
}


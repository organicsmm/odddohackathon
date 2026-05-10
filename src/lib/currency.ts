// Lightweight currency helper. Internal trip data is stored in USD;
// this module converts and formats for display/export.

export type CurrencyCode =
  | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'INR' | 'AUD' | 'CAD'
  | 'CHF' | 'CNY' | 'SGD' | 'AED' | 'THB' | 'MXN' | 'BRL' | 'ZAR';

export const CURRENCIES: { code: CurrencyCode; name: string; symbol: string }[] = [
  { code: 'USD', name: 'US Dollar',         symbol: '$'  },
  { code: 'EUR', name: 'Euro',              symbol: '€'  },
  { code: 'GBP', name: 'British Pound',     symbol: '£'  },
  { code: 'JPY', name: 'Japanese Yen',      symbol: '¥'  },
  { code: 'INR', name: 'Indian Rupee',      symbol: '₹'  },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar',   symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc',       symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan',      symbol: '¥'  },
  { code: 'SGD', name: 'Singapore Dollar',  symbol: 'S$' },
  { code: 'AED', name: 'UAE Dirham',        symbol: 'AED' },
  { code: 'THB', name: 'Thai Baht',         symbol: '฿'  },
  { code: 'MXN', name: 'Mexican Peso',      symbol: 'MX$' },
  { code: 'BRL', name: 'Brazilian Real',    symbol: 'R$' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
];

// Static fallback rates (1 USD = X). Refreshed from open.er-api.com when online.
const FALLBACK_RATES: Record<CurrencyCode, number> = {
  USD: 1, EUR: 0.92, GBP: 0.79, JPY: 156, INR: 83.5, AUD: 1.52, CAD: 1.37,
  CHF: 0.88, CNY: 7.25, SGD: 1.34, AED: 3.67, THB: 36.5, MXN: 18.2,
  BRL: 5.1, ZAR: 18.6,
};

const LS_KEY = 'traveloop:fx-rates:v1';
type CachedRates = { ts: number; rates: Record<string, number> };

let liveRates: Record<string, number> | null = null;
try {
  const raw = localStorage.getItem(LS_KEY);
  if (raw) {
    const parsed: CachedRates = JSON.parse(raw);
    if (Date.now() - parsed.ts < 24 * 60 * 60 * 1000) liveRates = parsed.rates;
  }
} catch { /* ignore */ }

let inflight: Promise<void> | null = null;
export function refreshRates(): Promise<void> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      if (!res.ok) throw new Error('rates http ' + res.status);
      const data = await res.json();
      if (data?.rates) {
        liveRates = data.rates;
        localStorage.setItem(LS_KEY, JSON.stringify({ ts: Date.now(), rates: data.rates }));
      }
    } catch { /* keep fallback */ } finally { inflight = null; }
  })();
  return inflight;
}

export function getRate(code: CurrencyCode): number {
  return liveRates?.[code] ?? FALLBACK_RATES[code] ?? 1;
}

export function convertFromUSD(amountUSD: number, code: CurrencyCode): number {
  return amountUSD * getRate(code);
}

export function formatMoney(amountUSD: number, code: CurrencyCode): string {
  const value = convertFromUSD(amountUSD, code);
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency', currency: code,
      maximumFractionDigits: code === 'JPY' || code === 'INR' ? 0 : 0,
    }).format(value);
  } catch {
    const sym = CURRENCIES.find(c => c.code === code)?.symbol ?? '$';
    return `${sym}${Math.round(value).toLocaleString()}`;
  }
}

const STORAGE_KEY = 'regrade-display-currency';
const RATES_CACHE_KEY = 'regrade-fx-rates-v1';
const RATES_TTL_MS = 12 * 60 * 60 * 1000;

export type DisplayCurrency =
  | 'USD'
  | 'AUD'
  | 'IDR'
  | 'JPY'
  | 'CNY'
  | 'INR'
  | 'AED'
  | 'SAR'
  | 'QAR'
  | 'KWD'
  | 'EGP'
  | 'BRL'
  | 'ARS'
  | 'CLP'
  | 'COP'
  | 'PEN'
  | 'MXN';

export type CurrencyOption = {
  code: DisplayCurrency;
  label: string;
  region: string;
};

/** Approximate USD→currency fallbacks when live FX is unavailable. */
const FALLBACK_RATES: Record<DisplayCurrency, number> = {
  USD: 1,
  AUD: 1.53,
  IDR: 16200,
  JPY: 157,
  CNY: 7.25,
  INR: 86,
  AED: 3.67,
  SAR: 3.75,
  QAR: 3.64,
  KWD: 0.31,
  EGP: 50.5,
  BRL: 5.7,
  ARS: 1050,
  CLP: 950,
  COP: 4100,
  PEN: 3.7,
  MXN: 19.5,
};

const ZERO_DECIMAL = new Set<DisplayCurrency>(['JPY', 'IDR', 'CLP', 'COP']);

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: 'USD', label: 'US Dollar', region: 'United States' },
  { code: 'AUD', label: 'Australian Dollar', region: 'Australia' },
  { code: 'IDR', label: 'Indonesian Rupiah', region: 'Indonesia' },
  { code: 'JPY', label: 'Japanese Yen', region: 'Japan' },
  { code: 'CNY', label: 'Chinese Yuan', region: 'China' },
  { code: 'INR', label: 'Indian Rupee', region: 'India' },
  { code: 'AED', label: 'UAE Dirham', region: 'United Arab Emirates' },
  { code: 'SAR', label: 'Saudi Riyal', region: 'Saudi Arabia' },
  { code: 'QAR', label: 'Qatari Riyal', region: 'Qatar' },
  { code: 'KWD', label: 'Kuwaiti Dinar', region: 'Kuwait' },
  { code: 'EGP', label: 'Egyptian Pound', region: 'Egypt' },
  { code: 'BRL', label: 'Brazilian Real', region: 'Brazil' },
  { code: 'ARS', label: 'Argentine Peso', region: 'Argentina' },
  { code: 'CLP', label: 'Chilean Peso', region: 'Chile' },
  { code: 'COP', label: 'Colombian Peso', region: 'Colombia' },
  { code: 'PEN', label: 'Peruvian Sol', region: 'Peru' },
  { code: 'MXN', label: 'Mexican Peso', region: 'Mexico' },
];

function isDisplayCurrency(value: string): value is DisplayCurrency {
  return CURRENCY_OPTIONS.some((option) => option.code === value);
}

export function readStoredCurrency(): DisplayCurrency {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value && isDisplayCurrency(value)) return value;
  } catch {
    // ignore
  }
  return 'USD';
}

export function storeCurrency(code: DisplayCurrency): void {
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // ignore
  }
}

type RatesCache = { fetchedAt: number; rates: Record<string, number> };

function readCachedRates(): RatesCache | null {
  try {
    const raw = localStorage.getItem(RATES_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RatesCache;
    if (!parsed?.rates || typeof parsed.fetchedAt !== 'number') return null;
    if (Date.now() - parsed.fetchedAt > RATES_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCachedRates(rates: Record<string, number>): void {
  try {
    const payload: RatesCache = { fetchedAt: Date.now(), rates };
    localStorage.setItem(RATES_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

export async function loadUsdRates(): Promise<Record<string, number>> {
  const cached = readCachedRates();
  if (cached) return { ...FALLBACK_RATES, ...cached.rates, USD: 1 };

  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!response.ok) throw new Error('FX unavailable');
    const body = await response.json() as { result?: string; rates?: Record<string, number> };
    if (body.result !== 'success' || !body.rates) throw new Error('FX unavailable');
    writeCachedRates(body.rates);
    return { ...FALLBACK_RATES, ...body.rates, USD: 1 };
  } catch {
    return { ...FALLBACK_RATES };
  }
}

export function convertFromUsd(
  usdAmount: number,
  currency: DisplayCurrency,
  rates: Record<string, number>,
): number {
  const rate = rates[currency] ?? FALLBACK_RATES[currency] ?? 1;
  return usdAmount * rate;
}

export function formatMoney(
  usdAmount: number,
  currency: DisplayCurrency,
  rates: Record<string, number>,
): string {
  const amount = convertFromUsd(usdAmount, currency, rates);
  const fractionDigits = ZERO_DECIMAL.has(currency) ? 0 : 2;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(amount);
  } catch {
    const symbol = currency === 'USD' ? '$' : `${currency} `;
    return `${symbol}${amount.toFixed(fractionDigits)}`;
  }
}

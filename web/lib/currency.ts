// SkillGig.id — salary / currency conversion helpers.
//
// Synced listings (Remotive) carry salaries in USD; some EU-targeted feeds come
// in EUR. The UI is IDR-first, so these helpers convert a foreign-currency
// amount into Rupiah using a configurable rate, then format it for display.
//
// Pure & client-safe: no 'server-only', no Supabase — safe to import from a
// Client Component. Rates are read once at module load from env (set on the
// server or baked at build) with sensible static fallbacks.

import { formatIDR, formatIDRNumber } from './utils';

/**
 * Static fallback FX rates (1 unit → IDR). Used when no env override is set.
 * These drift over time — refresh periodically or, better, wire a live FX feed
 * (TODO C3: e.g. https://api.exchangerate.host/latest?base=USD) and cache the
 * result. Until then, ballpark rates are fine for a "≈ Rp …" display.
 */
export const DEFAULT_RATES_TO_IDR: Readonly<Record<string, number>> = {
  USD: 16_300,
  EUR: 17_700,
  GBP: 20_700,
  IDR: 1,
};

/** Parse a positive-number env override, falling back to the static rate. */
function rateFromEnv(currency: string, fallback: number): number {
  const raw = process.env[`FX_${currency}_TO_IDR`];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * Conversion rate for a currency code into IDR. Honours `FX_<CCY>_TO_IDR` env
 * overrides when present (e.g. FX_USD_TO_IDR=16450); otherwise uses the static
 * default. Unknown currencies resolve to 1 (treated as already-IDR) so the
 * helper never silently inflates an amount.
 */
export function rateToIDR(currency: string): number {
  const key = (currency ?? '').trim().toUpperCase();
  if (!key) return 1;
  const fallback = DEFAULT_RATES_TO_IDR[key];
  if (fallback === undefined) return 1;
  return rateFromEnv(key, fallback);
}

/**
 * Convert an amount in `currency` to integer IDR.
 *   • 'IDR' (or unrecognised codes) pass through unchanged.
 *   • Uses `rateOverride` when supplied, else the env/default rate.
 *   • Floors to an integer rupiah (no sen); negatives clamp to 0.
 */
export function convertToIDR(
  amount: number,
  currency: string,
  rateOverride?: number,
): number {
  const value = Number.isFinite(amount) ? amount : 0;
  if (value <= 0) return 0;
  const rate = rateOverride ?? rateToIDR(currency);
  return Math.max(0, Math.round(value * rate));
}

/** Convert a min/max salary range to IDR in one call. */
export function salaryRangeToIDR(
  min: number,
  max: number,
  currency: string,
  rateOverride?: number,
): { min: number; max: number } {
  return {
    min: convertToIDR(min, currency, rateOverride),
    max: convertToIDR(max, currency, rateOverride),
  };
}

/**
 * Format a salary range as a single Rupiah string, converting first.
 *   convertSalaryRange(60_000, 90_000, 'USD')
 *     → "Rp 978.000.000 – Rp 1.467.000.000"
 *
 * Falls back to formatIDR on each bound (keeps the dash separator consistent
 * with utils.formatBudget). Use this anywhere a foreign-currency salary needs
 * an "≈ Rp …" Indonesian display.
 */
export function formatSalaryIDR(
  min: number,
  max: number,
  currency: string,
  rateOverride?: number,
): string {
  const idr = salaryRangeToIDR(min, max, currency, rateOverride);
  const dash = ' – ';
  return `${formatIDR(idr.min)}${dash}${formatIDR(idr.max)}`;
}

/**
 * Compact IDR range for cards — converts then collapses ≥1 juta to "Njt",
 * mirroring utils.formatSalaryRange's IDR branch. No period suffix: the caller
 * knows whether the source figure is monthly or annual and appends "/bln" (or
 * divides by 12 first) as appropriate.
 *   formatSalaryIDRCompact(60_000, 90_000, 'USD') → "Rp 978jt–1.467jt"
 */
export function formatSalaryIDRCompact(
  min: number,
  max: number,
  currency: string,
  rateOverride?: number,
): string {
  const idr = salaryRangeToIDR(min, max, currency, rateOverride);
  // formatIDRNumber (no "Rp"): the "Rp " below is the only prefix — using
  // formatIDR here would double it to "Rp Rp 500.000" for sub-juta values.
  const toJt = (n: number) =>
    n >= 1_000_000 ? `${formatIDRNumber(Math.round(n / 1_000_000))}jt` : formatIDRNumber(n);
  return `Rp ${toJt(idr.min)}–${toJt(idr.max)}`;
}

/**
 * Display-ready salary for a synced remote job: converts the foreign-currency
 * amount to IDR, collapses an equal min/max to a single figure, and appends the
 * period. This is what the /jobs cards should call — passing a raw GBP/USD
 * figure straight to utils.formatSalaryRange rendered it un-converted (a
 * £46.675/yr role showed "Rp 46.675/thn" instead of ≈ "Rp 966jt/thn").
 *
 *   formatSalaryRangeIDR(46_675, 46_675, 'GBP', 'thn') → "Rp 966jt/thn"
 *   formatSalaryRangeIDR(60_000, 90_000, 'USD', 'thn') → "Rp 978jt–1.467jt/thn"
 *   formatSalaryRangeIDR(0, 0, 'USD', 'thn')           → "Gaji nego"
 */
export function formatSalaryRangeIDR(
  min: number,
  max: number,
  currency: string,
  period: 'bln' | 'thn' = 'thn',
  rateOverride?: number,
): string {
  const idr = salaryRangeToIDR(min, max, currency, rateOverride);
  if (idr.min <= 0 && idr.max <= 0) return 'Gaji nego';
  const toJt = (n: number) =>
    n >= 1_000_000 ? `${formatIDRNumber(Math.round(n / 1_000_000))}jt` : formatIDRNumber(n);
  const lo = Math.min(idr.min, idr.max);
  const hi = Math.max(idr.min, idr.max);
  const body = lo === hi || lo <= 0 ? `Rp ${toJt(hi)}` : `Rp ${toJt(lo)}–${toJt(hi)}`;
  return `${body}/${period}`;
}

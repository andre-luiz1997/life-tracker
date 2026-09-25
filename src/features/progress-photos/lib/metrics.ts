/**
 * Parses user-typed decimals in either locale style: "72,5", "72.5", "1.234,5", "1,234.5".
 * Returns null for empty input and NaN for garbage (so the form can show an error).
 */
export function parseDecimal(input: string): number | null {
  const s = input.trim().replace(/\s/g, '');
  if (!s) return null;
  if (!/^-?[\d.,]+$/.test(s)) return Number.NaN;
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  // The last separator is the decimal one; the other is a thousands separator.
  const decimalSep = lastComma > lastDot ? ',' : '.';
  const thousandsSep = decimalSep === ',' ? '.' : ',';
  const normalized = s.split(thousandsSep).join('').replace(decimalSep, '.');
  const value = Number(normalized);
  return Number.isFinite(value) ? value : Number.NaN;
}

export function formatDecimal(value: number, locale: string, maxFractionDigits = 2): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: maxFractionDigits }).format(value);
}

export type MetricPoint = { date: Date; value: number };

export type MetricSummary = {
  first: MetricPoint;
  last: MetricPoint;
  min: number;
  max: number;
  /** last − first */
  change: number;
};

export function summarize(points: MetricPoint[]): MetricSummary | null {
  const first = points[0];
  const last = points.at(-1);
  if (!first || !last) return null;
  const values = points.map((p) => p.value);
  return {
    first,
    last,
    min: Math.min(...values),
    max: Math.max(...values),
    change: last.value - first.value,
  };
}

/** Signed, localized change, e.g. "−4,2 kg" / "+1,5 cm". */
export function formatChange(change: number, unit: string, locale: string): string {
  const sign = change > 0 ? '+' : change < 0 ? '−' : '';
  return `${sign}${formatDecimal(Math.abs(change), locale, 1)} ${unit}`.trim();
}

/**
 * Maps points to chart coordinates (x by time, y by value) in a width×height box with padding.
 * A flat series is centered vertically; a single point is centered horizontally.
 */
export function chartCoordinates(points: MetricPoint[], width: number, height: number, pad = 8) {
  if (!points.length) return [];
  const times = points.map((p) => p.date.getTime());
  const values = points.map((p) => p.value);
  const [t0, t1] = [Math.min(...times), Math.max(...times)];
  const [v0, v1] = [Math.min(...values), Math.max(...values)];
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  return points.map((p) => ({
    x: pad + (t1 === t0 ? innerW / 2 : ((p.date.getTime() - t0) / (t1 - t0)) * innerW),
    y: pad + (v1 === v0 ? innerH / 2 : (1 - (p.value - v0) / (v1 - v0)) * innerH),
  }));
}

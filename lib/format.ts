// lib/format.ts
// Formatting utilities

export function formatCurrency(n?: number | null) {
  if (n == null) return "—";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '0';
  }
  
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatPercent(value: number | null | undefined, options?: { fractionDigits?: number }): string {
  if (value === null || value === undefined) {
    return '0%';
  }
  
  const fractionDigits = options?.fractionDigits ?? 1;
  
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value / 100);
}

export function toNum(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v.replace(/[^0-9.\-]/g, ''));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}


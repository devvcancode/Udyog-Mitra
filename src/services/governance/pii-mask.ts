export type PiiKind = 'aadhaar' | 'mobile' | 'email' | 'pan' | 'gstin';
export type PiiRedaction = { kind: PiiKind; count: number };
export type MaskResult = { text: string; redactions: PiiRedaction[] };

const patterns: Array<{ kind: PiiKind; pattern: RegExp; mask: (value: string) => string }> = [
  { kind: 'aadhaar', pattern: /\b(?:\d[ -]?){11}\d\b/g, mask: (value) => `XXXX-XXXX-${value.replace(/\D/g, '').slice(-4)}` },
  { kind: 'gstin', pattern: /\b\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b/gi, mask: (value) => `${value.slice(0, 2)}XXXXX****${value.slice(-3)}` },
  { kind: 'pan', pattern: /\b[A-Z]{5}\d{4}[A-Z]\b/gi, mask: (value) => `${value.slice(0, 2)}XXX****${value.slice(-1)}` },
  { kind: 'email', pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, mask: (value) => `${value[0]}***@${value.split('@')[1]}` },
  { kind: 'mobile', pattern: /(?<!\d)(?:\+91[ -]?)?[6-9]\d{9}(?!\d)/g, mask: (value) => `${value.slice(0, value.length - 4).replace(/\d/g, 'X')}${value.slice(-4)}` },
];

export function maskPii(input: string): MaskResult {
  let text = input;
  const redactions: PiiRedaction[] = [];
  for (const item of patterns) {
    let count = 0;
    text = text.replace(item.pattern, (value) => { count += 1; return item.mask(value); });
    if (count) redactions.push({ kind: item.kind, count });
  }
  return { text, redactions };
}

export function maskObjectStrings<T>(value: T): { value: T; redactions: PiiRedaction[] } {
  const totals = new Map<PiiKind, number>();
  const visit = (item: unknown): unknown => {
    if (typeof item === 'string') {
      const masked = maskPii(item);
      for (const redaction of masked.redactions) totals.set(redaction.kind, (totals.get(redaction.kind) ?? 0) + redaction.count);
      return masked.text;
    }
    if (Array.isArray(item)) return item.map(visit);
    if (item && typeof item === 'object') return Object.fromEntries(Object.entries(item).map(([key, nested]) => [key, visit(nested)]));
    return item;
  };
  return { value: visit(value) as T, redactions: [...totals].map(([kind, count]) => ({ kind, count })) };
}
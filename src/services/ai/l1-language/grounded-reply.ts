import type { GroundedFact } from './contracts';

const digitMap: Record<string, string> = { '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9' };
const normalizeDigits = (value: string) => value.replace(/[०-९]/g, (digit) => digitMap[digit] ?? digit).replace(/,/g, '');

export function numericClaims(text: string): string[] {
  return (text.match(/(?:₹\s*)?[\d०-९]+(?:[.,][\d०-९]+)*/gu) ?? [])
    .map(normalizeDigits).map((value) => value.replace(/^₹\s*/, '').replace(/,/g, '').trim());
}

export function findUngroundedNumbers(reply: string, facts: GroundedFact[]): string[] {
  const supported = new Set(facts.flatMap((fact) => numericClaims(String(fact.value))));
  return numericClaims(reply).filter((claim) => !supported.has(claim));
}

export function ensureGroundedNumbers(reply: string, facts: GroundedFact[]): string | null {
  const ungrounded = findUngroundedNumbers(reply, facts);
  return ungrounded.length === 0 ? reply : null;
}
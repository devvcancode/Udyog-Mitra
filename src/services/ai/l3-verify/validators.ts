export type DeterministicCheck = { name: string; passed: boolean; severity: 'info' | 'warn' | 'block'; reasonTrace: string };

export function validateDocumentFields(fields: Record<string, string | number | boolean | null>): DeterministicCheck[] {
  const checks: DeterministicCheck[] = [];
  const pan = fields.pan;
  if (typeof pan === 'string') checks.push({ name: 'pan-format', passed: /^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(pan), severity: 'warn', reasonTrace: 'l3.validator.pan_format_only_not_source_verified' });
  const gstin = fields.gstin;
  if (typeof gstin === 'string') checks.push({ name: 'gstin-format', passed: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i.test(gstin), severity: 'warn', reasonTrace: 'l3.validator.gstin_format_only_not_source_verified' });
  if (!checks.length) checks.push({ name: 'field-validation', passed: false, severity: 'warn', reasonTrace: 'l3.validator.no_extracted_fields' });
  return checks;
}
import { z } from 'zod';

export const ConsentPurposeSchema = z.enum(['external_ai', 'digilocker_fetch', 'government_lookup', 'whatsapp_ingest', 'chat_history']);
export type ConsentPurpose = z.infer<typeof ConsentPurposeSchema>;

export const ConsentRecordSchema = z.object({
  id: z.string().uuid(),
  subjectId: z.string().min(1),
  purpose: ConsentPurposeSchema,
  scope: z.array(z.string().min(1)).min(1),
  grantedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  revokedAt: z.string().datetime().nullable(),
}).strict();
export type ConsentRecord = z.infer<typeof ConsentRecordSchema>;

export interface ConsentLedger {
  grant(input: { subjectId: string; purpose: ConsentPurpose; scope: string[]; ttlMs?: number }): ConsentRecord;
  revoke(id: string, subjectId: string): boolean;
  hasConsent(subjectId: string, purpose: ConsentPurpose, scope?: string): boolean;
  list(subjectId: string): ConsentRecord[];
}

export class InMemoryConsentLedger implements ConsentLedger {
  private readonly records = new Map<string, ConsentRecord>();

  grant(input: { subjectId: string; purpose: ConsentPurpose; scope: string[]; ttlMs?: number }): ConsentRecord {
    const now = Date.now();
    const record = ConsentRecordSchema.parse({
      id: crypto.randomUUID(), subjectId: input.subjectId, purpose: input.purpose, scope: input.scope,
      grantedAt: new Date(now).toISOString(), expiresAt: new Date(now + (input.ttlMs ?? 24 * 60 * 60 * 1000)).toISOString(), revokedAt: null,
    });
    this.records.set(record.id, record);
    return record;
  }

  revoke(id: string, subjectId: string): boolean {
    const record = this.records.get(id);
    if (!record || record.subjectId !== subjectId || record.revokedAt) return false;
    this.records.set(id, ConsentRecordSchema.parse({ ...record, revokedAt: new Date().toISOString() }));
    return true;
  }

  hasConsent(subjectId: string, purpose: ConsentPurpose, scope?: string): boolean {
    const now = Date.now();
    return [...this.records.values()].some((record) =>
      record.subjectId === subjectId && record.purpose === purpose && record.revokedAt === null
      && Date.parse(record.expiresAt) > now && (!scope || record.scope.includes(scope)),
    );
  }

  list(subjectId: string): ConsentRecord[] {
    return [...this.records.values()].filter((record) => record.subjectId === subjectId).map((record) => ConsentRecordSchema.parse(record));
  }
}

export const consentLedger: ConsentLedger = new InMemoryConsentLedger();
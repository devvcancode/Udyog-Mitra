import { z } from 'zod';

export const DocumentSourceIdSchema = z.enum(['manual', 'digilocker', 'gstn', 'udyam', 'mca', 'pan', 'landrecords', 'email', 'url', 'whatsapp', 'dept_issued']);
export type DocumentSourceId = z.infer<typeof DocumentSourceIdSchema>;
export const DocumentStatusSchema = z.enum(['VERIFIED', 'NEEDS_REVIEW', 'REJECTED']);
export const VerificationCheckSchema = z.object({ name: z.string(), passed: z.boolean(), detail: z.string(), severity: z.enum(['info', 'warn', 'block']) }).strict();
export const VerificationVerdictSchema = z.object({
  documentId: z.string(), docType: z.string(), status: DocumentStatusSchema, confidence: z.number().min(0).max(1),
  extractedFields: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
  checks: z.array(VerificationCheckSchema), evidence: z.array(z.string()), sourceOfTruth: z.string().nullable(), flags: z.array(z.string()),
  validUntil: z.string().datetime().nullable(), needsHuman: z.boolean(),
  explanation: z.object({ mr: z.string(), hi: z.string(), en: z.string() }).strict(),
  simulated: z.boolean(), reasonTrace: z.array(z.string()),
}).strict();
export type VerificationVerdict = z.infer<typeof VerificationVerdictSchema>;

export const VerificationInputSchema = z.object({
  documentId: z.string().min(1), docType: z.string().min(1), source: DocumentSourceIdSchema,
  fileName: z.string().min(1), mimeType: z.string(), byteSize: z.number().int().nonnegative(), contentHash: z.string().nullable(),
  sourceVerified: z.boolean(), simulatedSource: z.boolean().default(false), extractedFields: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).default({}),
}).strict();
export type VerificationInput = z.input<typeof VerificationInputSchema>;

export interface VerificationProvider {
  verify(input: VerificationInput): Promise<VerificationVerdict>;
}
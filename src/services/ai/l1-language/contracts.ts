import { z } from 'zod';

export const SupportedLanguageSchema = z.enum(['en', 'mr', 'hi']);
export type SupportedLanguage = z.infer<typeof SupportedLanguageSchema>;

export const IntentSchema = z.enum([
  'find_approvals', 'timeline_estimate', 'track_application', 'document_help', 'fetch_documents',
  'verify_document', 'scheme_match', 'grievance', 'talk_to_human', 'smalltalk',
]);
export type Intent = z.infer<typeof IntentSchema>;

export const ExtractedSlotsSchema = z.object({
  sector: z.string().nullable(), district: z.string().nullable(), taluka: z.string().nullable(),
  activity: z.enum(['manufacturing', 'service', 'trading']).nullable(), investmentLakhs: z.number().nonnegative().nullable(),
  applicationId: z.string().nullable(), documentType: z.string().nullable(), approvalId: z.string().nullable(),
}).strict();
export type ExtractedSlots = z.infer<typeof ExtractedSlotsSchema>;

export const GroundedFactSchema = z.object({ key: z.string(), value: z.union([z.string(), z.number(), z.boolean()]), source: z.string().nullable() }).strict();
export type GroundedFact = z.infer<typeof GroundedFactSchema>;

export const IntentResultSchema = z.object({ intent: IntentSchema, confidence: z.number().min(0).max(1), reasonTrace: z.array(z.string()) }).strict();
export const GroundedReplyInputSchema = z.object({ language: SupportedLanguageSchema, facts: z.array(GroundedFactSchema), handoff: z.boolean() }).strict();

export interface LanguageProvider {
  detectLanguage(message: string): Promise<SupportedLanguage>;
  classifyIntent(message: string, language: SupportedLanguage): Promise<z.infer<typeof IntentResultSchema>>;
  extractSlots(message: string, language: SupportedLanguage): Promise<ExtractedSlots>;
  generateGroundedReply(input: z.infer<typeof GroundedReplyInputSchema>): Promise<string>;
  simplifyOfficerQuery(query: string, language: SupportedLanguage): Promise<string>;
  draftQueryResponse(deficiencies: string[], facts: GroundedFact[], language: SupportedLanguage): Promise<string>;
  summarizeForVoice(reply: string, language: SupportedLanguage): Promise<string>;
}
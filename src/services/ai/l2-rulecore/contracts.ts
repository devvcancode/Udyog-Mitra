import { z } from 'zod';
import type { ProjectProfile } from '@/lib/engines';
import type { Intent } from '../l1-language/contracts';
import { DependencyPlanOutputSchema } from './dependency-planner';

export const ReasonTraceSchema = z.array(z.string().min(1));
export const RuleFactSchema = z.object({ key: z.string(), value: z.union([z.string(), z.number(), z.boolean()]), source: z.string().nullable() }).strict();
export const RuleCoreResultSchema = z.object({
  facts: z.array(RuleFactSchema), reasonTrace: ReasonTraceSchema, confidence: z.number().min(0).max(1), needsHuman: z.boolean(),
}).strict();
export type RuleFact = z.infer<typeof RuleFactSchema>;
export type RuleCoreResult = z.infer<typeof RuleCoreResultSchema>;

export const ChecklistOutputSchema = z.object({ approvalIds: z.array(z.string()), reasonTrace: ReasonTraceSchema, source: z.string() }).strict();
export const DependencyPlanSchema = DependencyPlanOutputSchema;
export const TimelineOutputSchema = z.object({ fastestDays: z.number().nonnegative(), p50Days: z.number().nonnegative(), p90Days: z.number().nonnegative(), confidence: z.number().min(0).max(1), reasonTrace: ReasonTraceSchema, source: z.string() }).strict();
export const RiskOutputSchema = z.object({ score: z.number().min(0).max(100), route: z.enum(['fast_track', 'standard', 'detailed_review']), reasonTrace: ReasonTraceSchema }).strict();
export const SchemeMatchSchema = z.object({ schemeId: z.string(), eligibility: z.enum(['potential_match', 'more_information_needed', 'not_matched']), reasonTrace: ReasonTraceSchema }).strict();
export const ReadinessOutputSchema = z.object({ score: z.number().min(0).max(100), missingItems: z.array(z.string()), reasonTrace: ReasonTraceSchema }).strict();
export const InspectionSlotSchema = z.object({ groupId: z.string(), departmentCodes: z.array(z.string()), suggestedDay: z.number().int().positive(), reasonTrace: ReasonTraceSchema }).strict();
export const BottleneckOutputSchema = z.object({ department: z.string().nullable(), signal: z.enum(['insufficient_history', 'potential_bottleneck']), reasonTrace: ReasonTraceSchema }).strict();

export interface RuleCoreProvider {
  findApprovals(profile: ProjectProfile): Promise<z.infer<typeof ChecklistOutputSchema>>;
  planDependencies(approvalIds: string[]): Promise<z.infer<typeof DependencyPlanSchema>>;
  estimateTimeline(input: { approvalIds: string[]; documentsReadyRatio: number; profile: ProjectProfile }): Promise<z.infer<typeof TimelineOutputSchema>>;
  scoreRisk(profile: ProjectProfile, complianceIssues?: number): Promise<z.infer<typeof RiskOutputSchema>>;
  matchSchemes(profile: ProjectProfile): Promise<Array<z.infer<typeof SchemeMatchSchema>>>;
  scoreReadiness(input: { requiredDocuments: number; verifiedDocuments: number; fieldsComplete: number; totalFields: number }): Promise<z.infer<typeof ReadinessOutputSchema>>;
  scheduleInspections(input: { applicationId: string; departments: string[] }): Promise<z.infer<typeof InspectionSlotSchema>>;
  detectBottleneck(input: { departmentDurations: number[]; department: string }): Promise<z.infer<typeof BottleneckOutputSchema>>;
  evaluateIntent(input: { intent: Intent; profile: ProjectProfile }): Promise<RuleCoreResult>;
}
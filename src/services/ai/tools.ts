import { z } from 'zod';
import { approvals, schemes } from '@/lib/demo-data';
import type { ProjectProfile } from '@/lib/engines';
import { consentLedger } from '../governance/consent';
import { mockDigiLockerSource } from '../connectors/mock-digilocker';
import { mockRuleCore } from './l2-rulecore/mock-rule-core';
import { VerificationInputSchema } from './l3-verify/contracts';
import { verificationPipeline } from './l3-verify/pipeline';
import { GroundedFactSchema, type GroundedFact } from './l1-language/contracts';

export const AgentToolNameSchema = z.enum(['startChecklist', 'estimateTimeline', 'fetchDocuments', 'verifyDocument', 'trackApplication', 'matchSchemes', 'createGrievance', 'navigate']);
export type AgentToolName = z.infer<typeof AgentToolNameSchema>;

const ProjectProfileSchema = z.object({
  activity: z.enum(['manufacturing', 'service', 'trading']), sector: z.string(), investmentLakhs: z.number().nonnegative(),
  employees: z.number().int().nonnegative(), powerKw: z.number().nonnegative(), waterKld: z.number().nonnegative(),
  hazardous: z.boolean(), stage: z.string(), landType: z.string(),
}).strict();

export const AgentToolCallSchema = z.object({
  name: AgentToolNameSchema, actorId: z.string().nullable(), role: z.enum(['applicant', 'officer', 'nodal', 'admin']).nullable(),
  profile: ProjectProfileSchema.optional(), applicationId: z.string().nullable().optional(), approvalId: z.string().nullable().optional(), destination: z.string().nullable().optional(), document: VerificationInputSchema.optional(),
}).strict();
export type AgentToolCall = z.input<typeof AgentToolCallSchema>;

export const AgentToolResultSchema = z.object({
  name: AgentToolNameSchema, facts: z.array(GroundedFactSchema), sources: z.array(z.object({ title: z.string(), href: z.string() }).strict()),
  reasonTrace: z.array(z.string()), confidence: z.number().min(0).max(1), needsHuman: z.boolean(), destination: z.string().nullable(),
}).strict();
export type AgentToolResult = z.infer<typeof AgentToolResultSchema>;
export type ApplicationStatusReader = (actorId: string, role: NonNullable<z.infer<typeof AgentToolCallSchema>['role']>, applicationId: string) => Promise<{ status: string; source: string } | null>;
type AgentToolHandler = (input: z.infer<typeof AgentToolCallSchema>) => Promise<AgentToolResult>;

const safeRoutes = new Set(['/know-your-approvals', '/applications', '/documents', '/incentives', '/grievance', '/contact', '/dashboard']);
const emptyFacts: GroundedFact[] = [];

export class AgentToolRegistry {
  private readonly handlers = new Map<AgentToolName, AgentToolHandler>();
  register(name: AgentToolName, handler: AgentToolHandler): this { this.handlers.set(name, handler); return this; }
  names(): AgentToolName[] { return [...this.handlers.keys()]; }
  async execute(rawInput: AgentToolCall): Promise<AgentToolResult> {
    const input = AgentToolCallSchema.parse(rawInput);
    const handler = this.handlers.get(input.name);
    if (!handler) return AgentToolResultSchema.parse({ name: input.name, facts: emptyFacts, sources: [], reasonTrace: ['orchestrator.tool.not_registered'], confidence: 0, needsHuman: true, destination: '/contact' });
    return AgentToolResultSchema.parse(await handler(input));
  }
}

export function createAgentToolRegistry(options: { readApplicationStatus?: ApplicationStatusReader } = {}): AgentToolRegistry {
  const registry = new AgentToolRegistry();
  registry.register('startChecklist', async (input) => {
    if (!input.profile) return { name: 'startChecklist', facts: [{ key: 'nextStep', value: 'Describe your project to build an illustrative checklist.', source: 'Udyog Mitra checklist wizard' }], sources: [], reasonTrace: ['tool.start_checklist.profile_required'], confidence: .5, needsHuman: false, destination: '/know-your-approvals' };
    const result = await mockRuleCore.evaluateIntent({ intent: 'find_approvals', profile: input.profile });
    return {
      name: 'startChecklist', facts: result.facts, sources: [{ title: 'Illustrative approval catalogue', href: '/know-your-approvals' }],
      reasonTrace: result.reasonTrace, confidence: result.confidence, needsHuman: result.needsHuman, destination: '/know-your-approvals',
    };
  });
  registry.register('estimateTimeline', async (input) => {
    const profile = input.profile as ProjectProfile | undefined;
    if (!profile) return { name: 'estimateTimeline', facts: emptyFacts, sources: [], reasonTrace: ['tool.timeline.profile_required'], confidence: 0, needsHuman: true, destination: '/know-your-approvals' };
    const selected = input.approvalId && approvals.some((approval) => approval.id === input.approvalId)
      ? { approvalIds: [input.approvalId] }
      : await mockRuleCore.findApprovals(profile);
    const estimate = await mockRuleCore.estimateTimeline({ approvalIds: selected.approvalIds, documentsReadyRatio: 0, profile });
    const approval = input.approvalId ? approvals.find((item) => item.id === input.approvalId) : null;
    return {
      name: 'estimateTimeline', facts: [
        { key: 'medianJourneyDays', value: estimate.p50Days, source: estimate.source },
        { key: 'conservativeJourneyDays', value: estimate.p90Days, source: estimate.source },
      ], sources: [{ title: approval ? `${approval.name.en} (illustrative)` : 'Illustrative approval catalogue', href: '/know-your-approvals' }], reasonTrace: [...estimate.reasonTrace, ...(approval ? [`l2.timeline.named_approval.${approval.id}`] : [])], confidence: estimate.confidence, needsHuman: true, destination: '/know-your-approvals',
    };
  });
  registry.register('fetchDocuments', async (input) => {
    if (!input.actorId || !consentLedger.hasConsent(input.actorId, 'digilocker_fetch', 'list')) return { name: 'fetchDocuments', facts: emptyFacts, sources: [], reasonTrace: ['tool.fetch_documents.purpose_consent_required'], confidence: 0, needsHuman: true, destination: '/documents' };
    const docs = await mockDigiLockerSource.listDocuments(input.actorId);
    return { name: 'fetchDocuments', facts: [{ key: 'availableDemoDocuments', value: docs.map((item) => item.displayName).join(', '), source: 'DigiLocker mock (simulated)' }], sources: [{ title: 'DigiLocker demo locker', href: '/documents' }], reasonTrace: ['tool.fetch_documents.mock_list'], confidence: .35, needsHuman: true, destination: '/documents' };
  });
  registry.register('verifyDocument', async (input) => {
    if (!input.document) return { name: 'verifyDocument', facts: emptyFacts, sources: [], reasonTrace: ['tool.verify_document.document_reference_required'], confidence: 0, needsHuman: true, destination: '/documents' };
    const verdict = await verificationPipeline.verify(input.document, input.actorId);
    return { name: 'verifyDocument', facts: [{ key: 'verificationStatus', value: verdict.status, source: verdict.sourceOfTruth }, { key: 'simulated', value: verdict.simulated, source: 'L3 mock verifier' }], sources: [], reasonTrace: verdict.reasonTrace, confidence: verdict.confidence, needsHuman: verdict.needsHuman, destination: '/documents' };
  });
  registry.register('trackApplication', async (input) => {
    if (!input.actorId || !input.role || !input.applicationId || !options.readApplicationStatus) return { name: 'trackApplication', facts: emptyFacts, sources: [], reasonTrace: ['tool.track_application.authenticated_owner_lookup_required'], confidence: 0, needsHuman: true, destination: '/applications' };
    const record = await options.readApplicationStatus(input.actorId, input.role, input.applicationId);
    if (!record) return { name: 'trackApplication', facts: emptyFacts, sources: [], reasonTrace: ['tool.track_application.not_found_or_not_owned'], confidence: 0, needsHuman: true, destination: '/applications' };
    return { name: 'trackApplication', facts: [{ key: 'applicationStatus', value: record.status, source: record.source }], sources: [{ title: input.applicationId, href: `/applications/${input.applicationId}` }], reasonTrace: ['tool.track_application.owner_scoped_lookup'], confidence: .9, needsHuman: false, destination: null };
  });
  registry.register('matchSchemes', async (input) => {
    if (!input.profile) return { name: 'matchSchemes', facts: emptyFacts, sources: [], reasonTrace: ['tool.scheme_match.profile_required'], confidence: 0, needsHuman: true, destination: '/incentives' };
    const matches = await mockRuleCore.matchSchemes(input.profile);
    const selected = matches.filter((item) => item.eligibility === 'potential_match').map((item) => item.schemeId);
    const names = selected.map((id) => schemesName(id));
    return { name: 'matchSchemes', facts: [{ key: 'potentialIllustrativeSchemes', value: names.join(', ') || 'none', source: 'illustrative scheme catalog' }], sources: [], reasonTrace: ['tool.scheme_match.profile_tags'], confidence: .4, needsHuman: false, destination: '/incentives' };
  });
  registry.register('createGrievance', async () => ({ name: 'createGrievance', facts: [], sources: [], reasonTrace: ['tool.grievance.requires_user_confirmation'], confidence: .2, needsHuman: true, destination: '/grievance' }));
  registry.register('navigate', async (input) => {
    const destination = input.destination && safeRoutes.has(input.destination) ? input.destination : null;
    return { name: 'navigate', facts: [], sources: [], reasonTrace: [destination ? 'tool.navigate.allowlisted_route' : 'tool.navigate.destination_not_allowed'], confidence: destination ? .95 : .1, needsHuman: !destination, destination: destination ?? '/contact' };
  });
  return registry;
}

function schemesName(id: string): string { return schemes.find((scheme) => scheme.id === id)?.name.en ?? id; }

export const agentToolRegistry = createAgentToolRegistry();

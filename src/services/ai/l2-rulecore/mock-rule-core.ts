import { approvalDependencies, approvals, schemes } from '@/lib/demo-data';
import { calculateRisk, generateChecklist, type ProjectProfile } from '@/lib/engines';
import {
  BottleneckOutputSchema, ChecklistOutputSchema, DependencyPlanSchema, InspectionSlotSchema,
  ReadinessOutputSchema, RiskOutputSchema, RuleCoreResultSchema, SchemeMatchSchema, TimelineOutputSchema,
  type RuleCoreProvider,
} from './contracts';
import { planDependencyGraph } from './dependency-planner';
import { estimateJourney } from './timeline-engine';

export class MockRuleCore implements RuleCoreProvider {
  async findApprovals(profile: ProjectProfile) {
    const selected = generateChecklist(profile);
    return ChecklistOutputSchema.parse({ approvalIds: selected.map((item) => item.id), reasonTrace: ['l2.rules.profile_conditions_matched', `l2.rules.activity.${profile.activity}`], source: 'illustrative-approval-catalog' });
  }

  async planDependencies(approvalIds: string[]) {
    const selected = approvals.filter((approval) => approvalIds.includes(approval.id));
    const selectedIds = new Set(selected.map((approval) => approval.id));
    return planDependencyGraph(selected.map((approval) => ({
      id: approval.id,
      durationDays: approval.days,
      stage: approval.stage,
      dependsOn: approvalDependencies.filter((edge) => edge.approvalId === approval.id && selectedIds.has(edge.dependsOnId)).map((edge) => edge.dependsOnId),
    })));
  }

  async estimateTimeline(input: { approvalIds: string[]; documentsReadyRatio: number; profile: ProjectProfile }) {
    const requiredDocuments = approvals.filter((approval) => input.approvalIds.includes(approval.id)).flatMap((approval) => approval.documents.map((document) => document.en));
    const readyCount = Math.round(requiredDocuments.length * Math.min(1, Math.max(0, input.documentsReadyRatio)));
    const documents = requiredDocuments.map((docType, index) => ({ docType, status: index < readyCount ? 'have/verified' as const : 'missing' as const, source: index < readyCount ? 'DigiLocker' as const : 'none' as const }));
    const journey = estimateJourney({ approvalIds: input.approvalIds, profile: input.profile, documents, simulationRuns: 2000, seed: 20261003 });
    return TimelineOutputSchema.parse({
      fastestDays: journey.fastestPossibleDays, p50Days: journey.expectedDays, p90Days: journey.conservativeDays, confidence: journey.confidence,
      reasonTrace: [...journey.reasonTrace, `l2.timeline.documents_ready_${Math.round(input.documentsReadyRatio * 100)}_percent`],
      source: journey.source,
    });
  }

  async scoreRisk(profile: ProjectProfile, complianceIssues = 0) {
    const score = calculateRisk(profile, complianceIssues);
    const route = score < 30 ? 'fast_track' : score >= 60 ? 'detailed_review' : 'standard';
    return RiskOutputSchema.parse({ score, route, reasonTrace: ['l2.risk.sector_category', 'l2.risk.hazard_and_scale', `l2.risk.compliance_issues_${complianceIssues}`] });
  }

  async matchSchemes(profile: ProjectProfile) {
    const tags = new Set([profile.activity, ...(profile.investmentLakhs <= 250 ? ['msme'] : []), ...(profile.powerKw >= 50 ? ['power'] : []), ...(profile.sector === 'Green' ? ['green'] : [])]);
    return schemes.map((scheme) => SchemeMatchSchema.parse({
      schemeId: scheme.id,
      eligibility: scheme.tags.some((tag) => tags.has(tag)) ? 'potential_match' : 'more_information_needed',
      reasonTrace: ['l2.scheme.profile_tag_match', `l2.scheme.${scheme.id}`],
    }));
  }

  async scoreReadiness(input: { requiredDocuments: number; verifiedDocuments: number; fieldsComplete: number; totalFields: number }) {
    const docsRatio = input.requiredDocuments === 0 ? 1 : Math.min(1, input.verifiedDocuments / input.requiredDocuments);
    const fieldsRatio = input.totalFields === 0 ? 1 : Math.min(1, input.fieldsComplete / input.totalFields);
    const score = Math.round((docsRatio * 60 + fieldsRatio * 40) * 100);
    const missingItems = [
      ...(input.verifiedDocuments < input.requiredDocuments ? ['l2.readiness.documents_missing_or_unverified'] : []),
      ...(input.fieldsComplete < input.totalFields ? ['l2.readiness.required_fields_missing'] : []),
    ];
    return ReadinessOutputSchema.parse({ score, missingItems, reasonTrace: ['l2.readiness.document_coverage', 'l2.readiness.field_completeness'] });
  }

  async scheduleInspections(input: { applicationId: string; departments: string[] }) {
    const departmentsToVisit = [...new Set(input.departments)];
    return InspectionSlotSchema.parse({ groupId: `joint-${input.applicationId}`, departmentCodes: departmentsToVisit, suggestedDay: 7, reasonTrace: ['l2.inspection.same_site_departments_clustered', 'l2.inspection.mock_availability'] });
  }

  async detectBottleneck(input: { departmentDurations: number[]; department: string }) {
    if (input.departmentDurations.length < 5) return BottleneckOutputSchema.parse({ department: null, signal: 'insufficient_history', reasonTrace: ['l2.bottleneck.insufficient_history'] });
    const sorted = [...input.departmentDurations].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const maximum = sorted.at(-1) ?? median;
    const isBottleneck = median > 0 && maximum > median * 1.8;
    return BottleneckOutputSchema.parse({ department: isBottleneck ? input.department : null, signal: isBottleneck ? 'potential_bottleneck' : 'insufficient_history', reasonTrace: ['l2.bottleneck.robust_median_comparison'] });
  }

  async evaluateIntent(input: { intent: 'find_approvals' | 'timeline_estimate' | 'track_application' | 'document_help' | 'fetch_documents' | 'verify_document' | 'scheme_match' | 'grievance' | 'talk_to_human' | 'smalltalk'; profile: ProjectProfile }) {
    if (input.intent === 'find_approvals' || input.intent === 'timeline_estimate') {
      const checklist = await this.findApprovals(input.profile);
      const timeline = await this.estimateTimeline({ approvalIds: checklist.approvalIds, documentsReadyRatio: 0, profile: input.profile });
      const chosenApprovals = approvals.filter((item) => checklist.approvalIds.includes(item.id));
      return RuleCoreResultSchema.parse({ facts: [
        { key: 'requiredApprovals', value: chosenApprovals.map((item) => item.name.en).join(', '), source: checklist.source },
        { key: 'medianJourneyDays', value: timeline.p50Days, source: timeline.source },
        { key: 'conservativeJourneyDays', value: timeline.p90Days, source: timeline.source },
      ], reasonTrace: [...checklist.reasonTrace, ...timeline.reasonTrace], confidence: timeline.confidence, needsHuman: false });
    }
    if (input.intent === 'scheme_match') {
      const matches = (await this.matchSchemes(input.profile)).filter((item) => item.eligibility === 'potential_match');
      return RuleCoreResultSchema.parse({ facts: [{ key: 'potentialSchemeIds', value: matches.map((item) => item.schemeId).join(', ') || 'none', source: 'illustrative-scheme-catalog' }], reasonTrace: ['l2.scheme.profile_eligibility_match'], confidence: .35, needsHuman: false });
    }
    return RuleCoreResultSchema.parse({ facts: [], reasonTrace: ['l2.intent.no_deterministic_facts_for_intent'], confidence: 0, needsHuman: true });
  }
}

export const mockRuleCore: RuleCoreProvider = new MockRuleCore();
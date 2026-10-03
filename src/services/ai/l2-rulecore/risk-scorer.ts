import type { ProjectProfile } from '@/lib/engines';
import { mockRuleCore } from './mock-rule-core';

export const riskScorer = { score: (profile: ProjectProfile, complianceIssues = 0) => mockRuleCore.scoreRisk(profile, complianceIssues) };
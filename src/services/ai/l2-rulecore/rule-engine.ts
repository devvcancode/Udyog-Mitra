import type { ProjectProfile } from '@/lib/engines';
import { mockRuleCore } from './mock-rule-core';

export const ruleEngine = { evaluateProfile: (profile: ProjectProfile) => mockRuleCore.findApprovals(profile) };
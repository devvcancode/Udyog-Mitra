import type { ProjectProfile } from '@/lib/engines';
import { mockRuleCore } from './mock-rule-core';

export const schemeMatcher = { match: (profile: ProjectProfile) => mockRuleCore.matchSchemes(profile) };
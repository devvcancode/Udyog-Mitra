import { mockRuleCore } from './mock-rule-core';

export const readinessScorer = { score: (input: { requiredDocuments: number; verifiedDocuments: number; fieldsComplete: number; totalFields: number }) => mockRuleCore.scoreReadiness(input) };
import { mockRuleCore } from './mock-rule-core';

export const commonInspectionScheduler = { cluster: (input: { applicationId: string; departments: string[] }) => mockRuleCore.scheduleInspections(input) };
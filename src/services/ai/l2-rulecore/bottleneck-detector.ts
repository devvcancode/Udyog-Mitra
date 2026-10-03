import { mockRuleCore } from './mock-rule-core';

export const bottleneckDetector = { detect: (input: { departmentDurations: number[]; department: string }) => mockRuleCore.detectBottleneck(input) };
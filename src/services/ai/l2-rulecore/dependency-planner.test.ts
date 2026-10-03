import { describe, expect, it } from 'vitest';
import { DependencyCycleError, planDependencyGraph } from './dependency-planner';

describe('dependency planner critical path method', () => {
  it('computes the longest path, parallel start groups, and slack', () => {
    const result = planDependencyGraph([
      { id: 'A', durationDays: 3, dependsOn: [] },
      { id: 'B', durationDays: 4, dependsOn: ['A'] },
      { id: 'C', durationDays: 10, dependsOn: [] },
      { id: 'D', durationDays: 2, dependsOn: ['B', 'C'] },
    ]);
    expect(result.criticalPath).toEqual(['C', 'D']);
    expect(result.durationDays).toBe(12);
    expect(result.slackDays.A).toBe(3);
    expect(result.slackDays.B).toBe(3);
    expect(result.slackDays.C).toBe(0);
    expect(result.slackDays.D).toBe(0);
    expect(result.groups[0]).toContain('A');
    expect(result.groups[0]).toContain('C');
  });

  it('detects cycles rather than returning a partial order', () => {
    expect(() => planDependencyGraph([
      { id: 'A', durationDays: 1, dependsOn: ['B'] },
      { id: 'B', durationDays: 1, dependsOn: ['A'] },
    ])).toThrow(DependencyCycleError);
  });

  it('rejects edges to approvals outside the generated checklist', () => {
    expect(() => planDependencyGraph([{ id: 'A', durationDays: 1, dependsOn: ['missing'] }])).toThrow('Unknown dependency');
  });
});
import { describe, expect, it } from 'vitest';
import { addWorkingDays, estimateJourney, estimateWhatIf, workingDaysBetween } from './timeline-engine';
import type { ProjectProfile } from '@/lib/engines';

const profile: ProjectProfile = {
  activity: 'manufacturing', sector: 'Orange', investmentLakhs: 180, employees: 24,
  powerKw: 75, waterKld: 12, hazardous: false, stage: 'Planning', landType: 'MIDC',
};

describe('timeline engine', () => {
  it('returns per-approval, per-document, critical path, and P50/P80/P90 estimates deterministically', () => {
    const input = { approvalIds: ['building', 'fire', 'cte', 'cto'], profile, startDate: '2026-10-05T00:00:00.000Z', simulationRuns: 2000, seed: 77 };
    const result = estimateJourney(input);
    expect(result).toEqual(estimateJourney(input));
    expect(result.p80Days).toBeGreaterThanOrEqual(result.expectedDays);
    expect(result.conservativeDays).toBeGreaterThanOrEqual(result.p80Days);
    expect(result.criticalPath.length).toBeGreaterThan(0);
    expect(result.criticalPath.every((id) => input.approvalIds.includes(id))).toBe(true);
    expect(result.parallelGroups.length).toBeGreaterThan(1);
    expect(result.approvals.every((approval) => approval.documents.length > 0)).toBe(true);
  });

  it('reduces procurement and total estimate when a required land document is verified', () => {
    const base = estimateJourney({ approvalIds: ['land'], profile, startDate: '2026-10-05T00:00:00.000Z', seed: 7 });
    const ready = estimateJourney({ approvalIds: ['land'], profile, documents: [{ docType: 'Land title and project layout', status: 'have/verified', source: 'DigiLocker' }], startDate: '2026-10-05T00:00:00.000Z', seed: 7 });
    expect(ready.approvals[0].documents[0].procurementDays).toBe(0);
    expect(ready.expectedDays).toBeLessThan(base.expectedDays);
    expect(ready.approvals[0].speedUpTips).toHaveLength(0);
  });

  it('uses working days and skips configured holidays and weekends', () => {
    const start = new Date('2026-10-02T00:00:00.000Z');
    const finish = addWorkingDays(start, 1, ['2026-10-02']);
    expect(finish.toISOString().slice(0, 10)).toBe('2026-10-05');
    expect(workingDaysBetween(start, finish, ['2026-10-02'])).toBe(1);
  });

  it('recomputes the what-if estimate and reports day and fee deltas', () => {
    const input = { approvalIds: ['land'], profile, startDate: '2026-10-05T00:00:00.000Z', seed: 11 };
    const result = estimateWhatIf(input, { approvalIds: ['udyam'] });
    expect(result.deltaDays).toBeLessThan(0);
    expect(result.feeDelta).toBe(-7500);
  });
});
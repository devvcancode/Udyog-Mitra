import { describe, expect, it } from 'vitest';
import { calculateRisk, calculateSla, generateChecklist, validateApplication, type ProjectProfile } from './engines';

const baseProfile: ProjectProfile = {
  activity: 'manufacturing',
  sector: 'Orange',
  investmentLakhs: 180,
  employees: 24,
  powerKw: 75,
  waterKld: 12,
  hazardous: false,
  stage: 'Planning',
  landType: 'MIDC',
};

describe('approval rule engine', () => {
  it('includes core registrations and sector-specific permits', () => {
    const checklist = generateChecklist({ ...baseProfile, sector: 'Red', hazardous: true });
    const ids = checklist.map((item) => item.id);
    expect(ids).toContain('udyam');
    expect(ids).toContain('gst');
    expect(ids).toContain('cte');
    expect(ids).toContain('hazardous');
    expect(ids).not.toContain('fssai');
  });

  it('adds service registrations and omits manufacturing-only permits', () => {
    const checklist = generateChecklist({ ...baseProfile, activity: 'service', investmentLakhs: 20, employees: 2, powerKw: 5, waterKld: 1, sector: 'Green' });
    const ids = checklist.map((item) => item.id);
    expect(ids).toContain('shop');
    expect(ids).toContain('trade');
    expect(ids).not.toContain('factory');
  });
});

describe('application pre-validation', () => {
  const valid = { pan: 'ABCDE1234F', gstin: '27ABCDE1234F1Z5', mobile: '9876543210', pincode: '411001', investmentLakhs: 180, msmeCategory: 'Micro', plotArea: 1000, builtUpArea: 700, requiredDocumentCount: 1 };

  it('accepts correctly formatted, internally consistent application data', () => {
    expect(validateApplication(valid)).toEqual([]);
  });

  it('reports invalid identifiers, area mismatch, MSME mismatch, and missing documents', () => {
    const errors = validateApplication({ ...valid, pan: 'wrong', mobile: '123', pincode: '000000', investmentLakhs: 300, plotArea: 500, builtUpArea: 650, requiredDocumentCount: 0 });
    expect(errors).toHaveLength(6);
  });
});

describe('risk scoring', () => {
  it('routes higher hazard and compliance exposure to higher scrutiny', () => {
    const baseline = calculateRisk({ ...baseProfile, sector: 'Green' });
    const elevated = calculateRisk({ ...baseProfile, sector: 'Red', hazardous: true, investmentLakhs: 1200 }, 2);
    expect(baseline).toBeLessThan(elevated);
    expect(elevated).toBe(87);
  });
});

describe('SLA calculator', () => {
  it('pauses the clock for applicant query time', () => {
    const now = new Date('2026-10-03T00:00:00.000Z');
    expect(calculateSla(new Date('2026-10-02T00:00:00.000Z'), now, 3)).toEqual({ daysRemaining: 2, state: 'at-risk' });
  });

  it('marks an unpaused expired clock as breached', () => {
    expect(calculateSla(new Date('2026-10-01T00:00:00.000Z'), new Date('2026-10-03T00:00:00.000Z'))).toEqual({ daysRemaining: -2, state: 'breached' });
  });
});
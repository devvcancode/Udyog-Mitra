import { describe, expect, it } from 'vitest';
import { estimateRegistrationTimeline, registrationCatalog } from './registration-data';

describe('registration catalog and timeline estimator', () => {
  it('covers common entity structures and operational registrations', () => {
    expect(registrationCatalog.filter((item) => item.group === 'entity').length).toBeGreaterThanOrEqual(10);
    expect(registrationCatalog.some((item) => item.id === 'gst')).toBe(true);
    expect(registrationCatalog.some((item) => item.id === 'mpcb-consent')).toBe(true);
  });

  it('returns an estimate range and lowers delay for more complete verified inputs', () => {
    const incomplete = estimateRegistrationTimeline({ registrations: 7, complexity: .75, sectorRisk: .7, documentsReady: .2, identityVerified: false });
    const ready = estimateRegistrationTimeline({ registrations: 7, complexity: .75, sectorRisk: .7, documentsReady: 1, identityVerified: true });
    expect(incomplete.minimumDays).toBeLessThanOrEqual(incomplete.likelyDays);
    expect(incomplete.maximumDays).toBeGreaterThanOrEqual(incomplete.likelyDays);
    expect(ready.likelyDays).toBeLessThan(incomplete.likelyDays);
    expect(ready.trainingNotice).toContain('synthetic');
  });
});
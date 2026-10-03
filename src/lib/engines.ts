import { approvals, type Approval } from './demo-data';

export type ProjectProfile = {
  activity: 'manufacturing' | 'service' | 'trading';
  sector: string;
  investmentLakhs: number;
  employees: number;
  powerKw: number;
  waterKld: number;
  hazardous: boolean;
  stage: string;
  landType: string;
};

export function generateChecklist(profile: ProjectProfile): Approval[] {
  const tags = new Set<string>(['all', profile.activity]);
  if (profile.investmentLakhs <= 250) tags.add('msme');
  if (profile.investmentLakhs >= 500) tags.add('large');
  if (profile.employees >= 10) tags.add('workers');
  if (profile.powerKw >= 50) tags.add('power');
  if (profile.waterKld >= 10) tags.add('water');
  if (profile.hazardous) tags.add('hazardous');
  if (['Red', 'Orange'].includes(profile.sector)) tags.add('pollution');
  if (profile.landType !== 'MIDC') tags.add('land');
  if (profile.sector.toLowerCase().includes('food')) tags.add('food');
  if (profile.sector.toLowerCase().includes('boiler')) tags.add('boiler');
  if (profile.landType.toLowerCase().includes('build')) tags.add('building');
  const stageOrder = ['Planning', 'Pre-establishment', 'Pre-operation', 'Operational'];
  const availableStage = stageOrder.indexOf(profile.stage);
  return approvals.filter((approval) =>
    approval.tags.some((tag) => tags.has(tag)) &&
    (availableStage < 0 || stageOrder.indexOf(approval.stage) >= availableStage - 1)
  );
}

export function calculateRisk(profile: ProjectProfile, complianceIssues = 0): number {
  let score = 10;
  if (profile.sector === 'Red') score += 35;
  else if (profile.sector === 'Orange') score += 20;
  else if (profile.sector === 'Green') score += 8;
  if (profile.hazardous) score += 20;
  if (profile.investmentLakhs > 1000) score += 12;
  else if (profile.investmentLakhs > 250) score += 6;
  if (profile.employees > 100) score += 8;
  score += Math.min(15, complianceIssues * 5);
  return Math.min(100, score);
}

export function validateApplication(input: { pan: string; gstin?: string; mobile: string; pincode: string; investmentLakhs: number; msmeCategory: string; plotArea: number; builtUpArea: number; requiredDocumentCount: number }): string[] {
  const errors: string[] = [];
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(input.pan.toUpperCase())) errors.push('PAN format is invalid.');
  if (input.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(input.gstin.toUpperCase())) errors.push('GSTIN format is invalid.');
  if (!/^[6-9][0-9]{9}$/.test(input.mobile)) errors.push('Enter a valid 10-digit mobile number.');
  if (!/^[1-9][0-9]{5}$/.test(input.pincode)) errors.push('Enter a valid six-digit pincode.');
  if (input.plotArea <= 0 || input.builtUpArea <= 0 || input.builtUpArea > input.plotArea) errors.push('Built-up area must be positive and no greater than plot area.');
  if (input.requiredDocumentCount < 1) errors.push('At least one supporting document is required.');
  if (input.investmentLakhs > 250 && input.msmeCategory !== 'Not MSME') errors.push('Investment exceeds this illustrative MSME category limit.');
  return errors;
}

export function calculateSla(dueDate: Date, now = new Date(), pausedDays = 0): { daysRemaining: number; state: 'on-time' | 'at-risk' | 'breached' } {
  const daysRemaining = Math.ceil((dueDate.getTime() - now.getTime()) / 86_400_000) + pausedDays;
  return { daysRemaining, state: daysRemaining < 0 ? 'breached' : daysRemaining <= 3 ? 'at-risk' : 'on-time' };
}
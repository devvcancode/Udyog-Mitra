import { z } from 'zod';
import { approvalDependencies, approvals } from '@/lib/demo-data';
import { calculateRisk, type ProjectProfile } from '@/lib/engines';
import { planDependencyGraph } from './dependency-planner';
import { sampleHolidayDates } from './holiday-calendar';

export const TimelineDocumentSchema = z.object({
	docType: z.string(), status: z.enum(['have/verified', 'have/unverified', 'missing']), source: z.enum(['DigiLocker', 'manual', 'connector', 'none']).default('none'),
	expectedReadyDate: z.string().datetime(), procurementDays: z.number().nonnegative(), verificationDays: z.number().nonnegative(),
}).strict();
export const ApprovalTimelineSchema = z.object({
	approvalId: z.string(), statutorySlaDays: z.number().nonnegative(), applicantPrepDays: z.number().nonnegative(),
	documentProcurementDays: z.number().nonnegative(), verificationDays: z.number().nonnegative(),
	scrutinyDays: z.object({ p50: z.number().nonnegative(), p90: z.number().nonnegative() }).strict(),
	queryLoopDays: z.object({ expected: z.number().nonnegative(), probability: z.number().min(0).max(1) }).strict(),
	inspectionWaitDays: z.number().nonnegative(),
	totalDays: z.object({ optimistic: z.number().nonnegative(), p50: z.number().nonnegative(), p90: z.number().nonnegative(), statutory: z.number().nonnegative() }).strict(),
	earliestStart: z.string().datetime(), expectedFinish: z.string().datetime(), confidence: z.number().min(0).max(1),
	drivers: z.array(z.string()), speedUpTips: z.array(z.string()), documents: z.array(TimelineDocumentSchema),
}).strict();
export const JourneyTimelineSchema = z.object({
	approvals: z.array(ApprovalTimelineSchema), fastestPossibleDays: z.number().nonnegative(), expectedDays: z.number().nonnegative(),
	p80Days: z.number().nonnegative(), conservativeDays: z.number().nonnegative(), statutoryTotalDays: z.number().nonnegative(),
	criticalPath: z.array(z.string()), parallelGroups: z.array(z.array(z.string())), slackDays: z.record(z.string(), z.number()),
	bottleneckApprovalId: z.string().nullable(), stageSplit: z.record(z.string(), z.number()), confidence: z.number().min(0).max(1),
	probabilityMeetingTarget: z.number().min(0).max(1).nullable(), targetDate: z.string().datetime().nullable(),
	reasonTrace: z.array(z.string()), source: z.string(),
}).strict();
export type TimelineDocument = z.infer<typeof TimelineDocumentSchema>;
export type ApprovalTimeline = z.infer<typeof ApprovalTimelineSchema>;
export type JourneyTimeline = z.infer<typeof JourneyTimelineSchema>;

export const TimelineInputSchema = z.object({
	approvalIds: z.array(z.string()).min(1), profile: z.object({
		activity: z.enum(['manufacturing', 'service', 'trading']), sector: z.string(), investmentLakhs: z.number().nonnegative(),
		employees: z.number().int().nonnegative(), powerKw: z.number().nonnegative(), waterKld: z.number().nonnegative(),
		hazardous: z.boolean(), stage: z.string(), landType: z.string(),
	}).strict(), documents: z.array(z.object({ docType: z.string(), status: TimelineDocumentSchema.shape.status, source: TimelineDocumentSchema.shape.source }).strict()).default([]),
	startDate: z.string().datetime().optional(), targetDate: z.string().datetime().optional(), holidays: z.array(z.string().date()).default(sampleHolidayDates),
	workloadFactor: z.number().min(.5).max(3).default(1), queryPauseDays: z.record(z.string(), z.number().nonnegative()).default({}),
	fastTrack: z.boolean().default(false), simulationRuns: z.number().int().min(100).max(10_000).default(2_000), seed: z.number().int().default(20261003),
}).strict();
export type TimelineInput = z.input<typeof TimelineInputSchema>;
export type WhatIfChange = { approvalIds?: string[]; documents?: TimelineInput['documents']; profile?: Partial<ProjectProfile>; fastTrack?: boolean };

const procurementRules: Array<{ match: RegExp; days: number }> = [
	{ match: /7\s*\/\s*12|land title|survey record|जमीन मालकी|सातबारा|खसरा/i, days: 7 },
	{ match: /chartered accountant|ca certificate|audited|लेखापरीक्षित/i, days: 5 },
	{ match: /architectural|building plan|इमारत आराखडा|भवन मानचित्र/i, days: 10 },
	{ match: /project report|pre-feasibility|प्रकल्प अहवाल/i, days: 12 },
	{ match: /fire plan|fire drawing|अग्निशमन/i, days: 6 },
	{ match: /water balance|hydrogeology|पाणी ताळेबंद/i, days: 8 },
];

export function documentProcurementDays(docType: string): number {
	return procurementRules.find((rule) => rule.match.test(docType))?.days ?? 4;
}

function toUtcDate(value: string): Date { return new Date(`${value.slice(0, 10)}T00:00:00.000Z`); }
function isoDate(date: Date): string { return date.toISOString(); }

export function addWorkingDays(start: Date, workingDays: number, holidays: string[] = sampleHolidayDates): Date {
	const date = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
	let remaining = Math.ceil(Math.max(0, workingDays));
	const holidaySet = new Set(holidays);
	while (remaining > 0) {
		date.setUTCDate(date.getUTCDate() + 1);
		const weekday = date.getUTCDay();
		const dayKey = date.toISOString().slice(0, 10);
		if (weekday !== 0 && weekday !== 6 && !holidaySet.has(dayKey)) remaining -= 1;
	}
	return date;
}

export function workingDaysBetween(start: Date, end: Date, holidays: string[] = sampleHolidayDates): number {
	const from = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
	const to = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
	const holidaySet = new Set(holidays);
	let days = 0;
	while (from < to) {
		from.setUTCDate(from.getUTCDate() + 1);
		const dayKey = from.toISOString().slice(0, 10);
		if (from.getUTCDay() !== 0 && from.getUTCDay() !== 6 && !holidaySet.has(dayKey)) days += 1;
	}
	return days;
}

function seededRandom(seed: number): () => number {
	let state = seed >>> 0;
	return () => { state = (state * 1664525 + 1013904223) >>> 0; return state / 0x1_0000_0000; };
}

function triangular(minimum: number, mode: number, maximum: number, random: () => number): number {
	if (maximum <= minimum) return minimum;
	const split = (mode - minimum) / (maximum - minimum);
	const unit = random();
	return unit < split
		? minimum + Math.sqrt(unit * (maximum - minimum) * (mode - minimum))
		: maximum - Math.sqrt((1 - unit) * (maximum - minimum) * (maximum - mode));
}

function quantile(values: number[], percentile: number): number {
	const sorted = [...values].sort((a, b) => a - b);
	return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * percentile))] ?? 0;
}

function dependenciesFor(approvalId: string, selectedIds: Set<string>): string[] {
	return approvalDependencies.filter((edge) => edge.approvalId === approvalId && selectedIds.has(edge.dependsOnId)).map((edge) => edge.dependsOnId);
}

export function estimateJourney(rawInput: TimelineInput): JourneyTimeline {
	const input = TimelineInputSchema.parse(rawInput);
	const selected = approvals.filter((approval) => input.approvalIds.includes(approval.id));
	if (selected.length === 0) throw new Error('Timeline requires at least one known approval.');
	const start = toUtcDate(input.startDate ?? new Date().toISOString());
	const selectedIds = new Set(selected.map((approval) => approval.id));
	const risk = calculateRisk(input.profile);
	const queryProbability = Math.min(.78, .12 + risk / 250);
	const inspectionWait = input.fastTrack ? 0 : risk >= 60 ? 14 : risk >= 35 ? 7 : 0;
	const perApproval = selected.map((approval): ApprovalTimeline => {
		const requiredDocs = approval.documents.map((document) => document.en);
		const docs = requiredDocs.map((docType): TimelineDocument => {
			const found = input.documents.find((document) => document.docType.toLowerCase() === docType.toLowerCase());
			const status = found?.status ?? 'missing';
			const procurementDays = status === 'missing' ? documentProcurementDays(docType) : 0;
			const verificationDays = status === 'have/verified' ? 0 : status === 'have/unverified' ? 2 : 1;
			const readyAfter = status === 'have/verified' ? 0 : procurementDays + verificationDays;
			return TimelineDocumentSchema.parse({
				docType, status, source: found?.source ?? 'none', procurementDays, verificationDays,
				expectedReadyDate: isoDate(addWorkingDays(start, readyAfter, input.holidays)),
			});
		});
		const applicantPrepDays = docs.some((document) => document.status !== 'have/verified') ? 1 : 0;
		const documentProcurement = docs.reduce((sum, document) => sum + document.procurementDays, 0);
		const verificationDays = docs.reduce((sum, document) => sum + document.verificationDays, 0);
		const pausedDays = input.queryPauseDays[approval.id] ?? 0;
		const p50Scrutiny = Math.max(1, approval.days * .8 * input.workloadFactor);
		const p90Scrutiny = Math.max(p50Scrutiny, approval.days * 1.3 * input.workloadFactor);
		const expectedQueryDays = queryProbability * 6;
		const approvalInspectionWait = selected.some((item) => item.id === approval.id && ['factory', 'fire', 'factoryinspection'].includes(item.id)) ? inspectionWait : 0;
		const p50 = applicantPrepDays + documentProcurement + verificationDays + p50Scrutiny + expectedQueryDays + approvalInspectionWait + pausedDays;
		const optimistic = applicantPrepDays + documentProcurement * .6 + verificationDays + p50Scrutiny * .75 + approvalInspectionWait * .5 + pausedDays;
		const conservative = applicantPrepDays + documentProcurement + verificationDays + p90Scrutiny + 6 + approvalInspectionWait + pausedDays;
		const drivers = [
			...(documentProcurement ? ['timeline.driver.documents_missing'] : []),
			...(risk >= 35 ? ['timeline.driver.risk_scrutiny'] : []),
			...(queryProbability >= .3 ? ['timeline.driver.query_probability'] : []),
			...(approvalInspectionWait ? ['timeline.driver.inspection_wait'] : []),
		];
		const speedUpTips = docs.filter((document) => document.status === 'missing').map((document) => `timeline.tip.fetch_or_prepare:${document.docType}`);
		return ApprovalTimelineSchema.parse({
			approvalId: approval.id, statutorySlaDays: approval.days, applicantPrepDays, documentProcurementDays: documentProcurement,
			verificationDays, scrutinyDays: { p50: p50Scrutiny, p90: p90Scrutiny },
			queryLoopDays: { expected: expectedQueryDays, probability: queryProbability }, inspectionWaitDays: approvalInspectionWait,
			totalDays: { optimistic, p50, p90: conservative, statutory: approval.days },
			earliestStart: isoDate(addWorkingDays(start, 0, input.holidays)), expectedFinish: isoDate(addWorkingDays(start, p50, input.holidays)),
			confidence: .2, drivers, speedUpTips, documents: docs,
		});
	});
	const durationFor = (field: 'optimistic' | 'p50' | 'p90' | 'statutory') => new Map(perApproval.map((estimate) => [estimate.approvalId, estimate.totalDays[field]]));
	const makePlan = (field: 'optimistic' | 'p50' | 'p90' | 'statutory') => planDependencyGraph(selected.map((approval) => ({
		id: approval.id, durationDays: durationFor(field).get(approval.id) ?? approval.days, stage: approval.stage,
		dependsOn: dependenciesFor(approval.id, selectedIds),
	})));
	const fastestPlan = makePlan('optimistic');
	const medianPlan = makePlan('p50');
	const conservativePlan = makePlan('p90');
	const statutoryPlan = makePlan('statutory');
	const random = seededRandom(input.seed);
	const simulations = Array.from({ length: input.simulationRuns }, () => {
		const draws = new Map(perApproval.map((estimate) => [estimate.approvalId, triangular(estimate.totalDays.optimistic, estimate.totalDays.p50, estimate.totalDays.p90, random)]));
		return planDependencyGraph(selected.map((approval) => ({ id: approval.id, durationDays: draws.get(approval.id) ?? approval.days, dependsOn: dependenciesFor(approval.id, selectedIds) }))).durationDays;
	});
	const expectedDays = Math.round(quantile(simulations, .5));
	const p80Days = Math.round(quantile(simulations, .8));
	const conservativeDays = Math.round(quantile(simulations, .9));
	const targetWorkingDays = input.targetDate ? workingDaysBetween(start, toUtcDate(input.targetDate), input.holidays) : null;
	const probabilityMeetingTarget = targetWorkingDays === null ? null : simulations.filter((value) => value <= targetWorkingDays).length / simulations.length;
	const stageSplit = Object.fromEntries(['Planning', 'Pre-establishment', 'Pre-operation', 'Operational'].map((stage) => {
		const rows = selected.filter((approval) => approval.stage === stage);
		return [stage, rows.reduce((max, approval) => Math.max(max, perApproval.find((row) => row.approvalId === approval.id)?.totalDays.p50 ?? 0), 0)];
	}));
	const bottleneck = [...perApproval].sort((a, b) => (b.totalDays.p90 - b.totalDays.p50) - (a.totalDays.p90 - a.totalDays.p50))[0];
	return JourneyTimelineSchema.parse({
		approvals: perApproval, fastestPossibleDays: Math.round(fastestPlan.durationDays), expectedDays,
		p80Days, conservativeDays, statutoryTotalDays: Math.round(statutoryPlan.durationDays),
		criticalPath: medianPlan.criticalPath, parallelGroups: medianPlan.groups, slackDays: medianPlan.slackDays,
		bottleneckApprovalId: bottleneck?.approvalId ?? null, stageSplit, confidence: .2,
		probabilityMeetingTarget, targetDate: input.targetDate ?? null,
		reasonTrace: [...medianPlan.reasonTrace, 'timeline.monte_carlo.seeded_2000_or_configured_runs', 'timeline.cold_start.synthetic_sla_factor', 'timeline.calendar.weekends_and_sample_holidays'],
		source: 'Illustrative catalog plus synthetic cold-start scenarios; not a statutory SLA.',
	});
}

export function estimateWhatIf(input: TimelineInput, change: WhatIfChange) {
	const before = estimateJourney(input);
	const after = estimateJourney({
		...input, approvalIds: change.approvalIds ?? input.approvalIds, profile: { ...input.profile, ...change.profile },
		documents: change.documents ?? input.documents, fastTrack: change.fastTrack ?? input.fastTrack,
	});
	const currentFee = (ids: string[]) => approvals.filter((approval) => ids.includes(approval.id)).reduce((sum, approval) => sum + approval.fee, 0);
	return {
		before, after, deltaDays: after.expectedDays - before.expectedDays,
		feeDelta: currentFee(change.approvalIds ?? input.approvalIds) - currentFee(input.approvalIds),
		reasonTrace: ['timeline.what_if.same_seed_comparison', 'timeline.what_if.fees_require_official_catalog_data'],
	};
}

export const timelineEngine = { estimate: estimateJourney, whatIf: estimateWhatIf, addWorkingDays, workingDaysBetween };
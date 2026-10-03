import { z } from 'zod';

export const DependencyNodeSchema = z.object({
	id: z.string().min(1), durationDays: z.number().nonnegative(), dependsOn: z.array(z.string()).default([]), stage: z.string().optional(),
}).strict();
export const DependencyGraphInputSchema = z.array(DependencyNodeSchema);
export const DependencyPlanOutputSchema = z.object({
	topologicalOrder: z.array(z.string()), criticalPath: z.array(z.string()), criticalPathDays: z.number().nonnegative(),
	durationDays: z.number().nonnegative(), groups: z.array(z.array(z.string())),
	earliestStart: z.record(z.string(), z.number()), earliestFinish: z.record(z.string(), z.number()),
	latestStart: z.record(z.string(), z.number()), latestFinish: z.record(z.string(), z.number()), slackDays: z.record(z.string(), z.number()),
	reasonTrace: z.array(z.string()),
}).strict();
export type DependencyNode = z.infer<typeof DependencyNodeSchema>;
export type DependencyPlan = z.infer<typeof DependencyPlanOutputSchema>;

export class DependencyCycleError extends Error {
	constructor(readonly cycleNodeIds: string[]) {
		super(`Approval dependency cycle: ${cycleNodeIds.join(', ')}`);
		this.name = 'DependencyCycleError';
	}
}

export function planDependencyGraph(rawNodes: DependencyNode[]): DependencyPlan {
	const nodes = DependencyGraphInputSchema.parse(rawNodes);
	const byId = new Map<string, DependencyNode>();
	for (const node of nodes) {
		if (byId.has(node.id)) throw new Error(`Duplicate dependency node: ${node.id}`);
		byId.set(node.id, node);
	}
	for (const node of nodes) {
		for (const dependency of node.dependsOn) {
			if (!byId.has(dependency)) throw new Error(`Unknown dependency ${dependency} required by ${node.id}`);
			if (dependency === node.id) throw new DependencyCycleError([node.id]);
		}
	}

	const successors = new Map(nodes.map((node) => [node.id, [] as string[]]));
	const indegree = new Map(nodes.map((node) => [node.id, node.dependsOn.length]));
	for (const node of nodes) for (const dependency of node.dependsOn) successors.get(dependency)?.push(node.id);
	const orderIndex = new Map(nodes.map((node, index) => [node.id, index]));
	const ready = nodes.filter((node) => indegree.get(node.id) === 0).map((node) => node.id);
	const topologicalOrder: string[] = [];
	while (ready.length) {
		ready.sort((left, right) => (orderIndex.get(left) ?? 0) - (orderIndex.get(right) ?? 0));
		const id = ready.shift()!;
		topologicalOrder.push(id);
		for (const successor of successors.get(id) ?? []) {
			indegree.set(successor, (indegree.get(successor) ?? 0) - 1);
			if (indegree.get(successor) === 0) ready.push(successor);
		}
	}
	if (topologicalOrder.length !== nodes.length) throw new DependencyCycleError(nodes.filter((node) => !topologicalOrder.includes(node.id)).map((node) => node.id));

	const earliestStart: Record<string, number> = {};
	const earliestFinish: Record<string, number> = {};
	for (const id of topologicalOrder) {
		const node = byId.get(id)!;
		earliestStart[id] = node.dependsOn.reduce((latest, dependency) => Math.max(latest, earliestFinish[dependency] ?? 0), 0);
		earliestFinish[id] = earliestStart[id] + node.durationDays;
	}
	const durationDays = Math.max(0, ...Object.values(earliestFinish));
	const latestStart: Record<string, number> = {};
	const latestFinish: Record<string, number> = {};
	for (const id of [...topologicalOrder].reverse()) {
		const node = byId.get(id)!;
		const next = successors.get(id) ?? [];
		latestFinish[id] = next.length ? Math.min(...next.map((successor) => latestStart[successor])) : durationDays;
		latestStart[id] = latestFinish[id] - node.durationDays;
	}
	const slackDays = Object.fromEntries(nodes.map((node) => [node.id, Math.max(0, latestStart[node.id] - earliestStart[node.id])]));

	const criticalPath: string[] = [];
	const sinks = nodes.filter((node) => (successors.get(node.id) ?? []).length === 0 && earliestFinish[node.id] === durationDays);
	let cursor = sinks.sort((a, b) => (orderIndex.get(a.id) ?? 0) - (orderIndex.get(b.id) ?? 0))[0]?.id;
	while (cursor) {
		criticalPath.unshift(cursor);
		const node = byId.get(cursor)!;
		const predecessor = node.dependsOn.find((id) => earliestFinish[id] === earliestStart[cursor]);
		if (!predecessor) break;
		cursor = predecessor;
	}

	const groupIds = new Map<number, string[]>();
	for (const id of topologicalOrder) {
		const start = earliestStart[id];
		const group = groupIds.get(start) ?? [];
		group.push(id);
		groupIds.set(start, group);
	}
	const groups = [...groupIds.entries()].sort(([a], [b]) => a - b).map(([, group]) => group);
	return DependencyPlanOutputSchema.parse({
		topologicalOrder, criticalPath, criticalPathDays: durationDays, durationDays, groups,
		earliestStart, earliestFinish, latestStart, latestFinish, slackDays,
		reasonTrace: ['l2.dependencies.kahn_topological_sort', 'l2.dependencies.cpm_forward_backward_pass', 'l2.dependencies.slack_calculated'],
	});
}

export const dependencyPlanner = { plan: planDependencyGraph };
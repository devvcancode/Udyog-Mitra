import { z } from 'zod';
import type { ChangeProposal } from './fetcher';

export const ChangeImpactSchema = z.object({ proposalId: z.string().uuid(), affectedApprovalIds: z.array(z.string()), status: z.literal('pending-admin-approval'), reasonTrace: z.array(z.string()) }).strict();

export function detectChangeImpact(proposal: ChangeProposal, rules: Array<{ approvalId: string; keywords: string[] }>) {
  const affectedApprovalIds = rules.filter((rule) => rule.keywords.some((keyword) => proposal.sourceId.toLowerCase().includes(keyword.toLowerCase()))).map((rule) => rule.approvalId);
  return ChangeImpactSchema.parse({ proposalId: proposal.id, affectedApprovalIds, status: 'pending-admin-approval', reasonTrace: ['knowledge.change.detected', 'knowledge.change.requires_admin_approval'] });
}
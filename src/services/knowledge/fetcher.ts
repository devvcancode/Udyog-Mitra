import { createHash } from 'node:crypto';
import { z } from 'zod';

export const KnowledgeSourceSchema = z.object({ id: z.string(), url: z.string().url(), hostname: z.string(), title: z.string() }).strict();
export const ChangeProposalSchema = z.object({
  id: z.string().uuid(), sourceId: z.string(), sourceUrl: z.string().url(), proposedVersion: z.string(), contentHash: z.string().regex(/^[a-f0-9]{64}$/),
  changed: z.boolean(), status: z.literal('pending-admin-approval'), createdAt: z.string().datetime(),
}).strict();
export type KnowledgeSource = z.infer<typeof KnowledgeSourceSchema>;
export type ChangeProposal = z.infer<typeof ChangeProposalSchema>;

export class KnowledgeFetcher {
  private readonly proposals: ChangeProposal[] = [];
  constructor(private readonly sources: KnowledgeSource[]) {
    for (const source of sources) {
      const parsed = KnowledgeSourceSchema.parse(source);
      if (new URL(parsed.url).protocol !== 'https:' || new URL(parsed.url).hostname !== parsed.hostname) throw new Error('Knowledge source must use its exact allowlisted HTTPS hostname.');
    }
  }

  propose(input: { sourceId: string; content: string; previousHash?: string }): ChangeProposal {
    const source = this.sources.find((candidate) => candidate.id === input.sourceId);
    if (!source) throw new Error('Knowledge source is not allowlisted.');
    const contentHash = createHash('sha256').update(input.content).digest('hex');
    const proposal = ChangeProposalSchema.parse({
      id: crypto.randomUUID(), sourceId: source.id, sourceUrl: source.url, proposedVersion: `sha256:${contentHash.slice(0, 12)}`,
      contentHash, changed: !input.previousHash || input.previousHash !== contentHash, status: 'pending-admin-approval', createdAt: new Date().toISOString(),
    });
    this.proposals.push(proposal);
    return proposal;
  }

  listPending(): ChangeProposal[] { return this.proposals.filter((proposal) => proposal.status === 'pending-admin-approval').map((proposal) => ChangeProposalSchema.parse(proposal)); }
}

export const defaultKnowledgeSources: KnowledgeSource[] = [
  { id: 'udyam', url: 'https://udyamregistration.gov.in/', hostname: 'udyamregistration.gov.in', title: 'Udyam registration' },
  { id: 'gst', url: 'https://www.gst.gov.in/', hostname: 'www.gst.gov.in', title: 'GST portal' },
  { id: 'mca', url: 'https://www.mca.gov.in/', hostname: 'www.mca.gov.in', title: 'MCA portal' },
];
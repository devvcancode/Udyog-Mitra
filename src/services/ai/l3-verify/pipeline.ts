import { auditSink } from '../../governance/audit';
import { reviewQueue } from '../../governance/review-queue';
import { MockVerificationProvider } from './mock-verifier';
import { VerificationInputSchema, type VerificationInput, type VerificationProvider } from './contracts';

export class VerificationPipeline {
  constructor(private readonly provider: VerificationProvider = new MockVerificationProvider()) {}

  async verify(input: VerificationInput, actorId: string | null = null) {
    const validated = VerificationInputSchema.parse(input);
    const verdict = await this.provider.verify(validated);
    auditSink.append({ actorId, action: 'document.verify', layer: 'l3', model: 'mock-verifier', reasonTrace: verdict.reasonTrace, input: { documentId: validated.documentId, docType: validated.docType, source: validated.source } });
    if (verdict.needsHuman) reviewQueue.enqueue({ subjectId: actorId ?? 'anonymous-demo', category: 'document-review', reason: verdict.flags.join(','), referenceId: verdict.documentId });
    return verdict;
  }
}

export const verificationPipeline = new VerificationPipeline();
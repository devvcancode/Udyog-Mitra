import { z } from 'zod';
import type { ConsentRecord } from '../governance/consent';
import type { DocumentSourceId } from '../ai/l3-verify/contracts';

export const RemoteDocumentSchema = z.object({
  reference: z.string().min(1), documentType: z.string().min(1), displayName: z.string().min(1),
  issuer: z.string().min(1), issuedAt: z.string().nullable(), expiresAt: z.string().nullable(),
  maskedIdentifier: z.string().nullable(), simulated: z.boolean(),
}).strict();
export type RemoteDocument = z.infer<typeof RemoteDocumentSchema>;

export const SourceVerificationSchema = z.object({
  matched: z.boolean(), simulated: z.boolean(), issuer: z.string().nullable(), reference: z.string().nullable(), reasonTrace: z.array(z.string()),
}).strict();
export type SourceVerification = z.infer<typeof SourceVerificationSchema>;

export type FetchedDocument = {
  reference: string;
  bytes: Uint8Array;
  mimeType: string;
  metadata: RemoteDocument;
  sha256: string;
};

export type SourceCapabilities = { listDocuments: boolean; fetchDocument: boolean; verifyAtSource: boolean };
export type AuthorizationFlow = { status: 'authorized' | 'consent-required' | 'not-configured'; consentId: string | null; simulated: boolean };

export interface DocumentSource {
  readonly id: DocumentSourceId;
  readonly capabilities: SourceCapabilities;
  authorize(userId: string, consent: ConsentRecord | null): Promise<AuthorizationFlow>;
  listDocuments(userId: string): Promise<RemoteDocument[]>;
  fetchDocument(userId: string, reference: string): Promise<FetchedDocument>;
  verifyAtSource(document: RemoteDocument): Promise<SourceVerification>;
}

export class ConnectorError extends Error {
  constructor(readonly code: 'CONSENT_REQUIRED' | 'NOT_CONFIGURED' | 'NOT_FOUND' | 'INVALID_FILE', message: string) {
    super(message);
    this.name = 'ConnectorError';
  }
}
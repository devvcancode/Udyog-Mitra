import { createHash } from 'node:crypto';
import { ConnectorError, RemoteDocumentSchema, SourceVerificationSchema, type DocumentSource, type FetchedDocument, type RemoteDocument, type SourceVerification } from './types';

const maxBytes = 10 * 1024 * 1024;
const allowedTypes = new Set(['application/pdf', 'image/jpeg', 'image/png']);

export class ManualUploadAdapter implements DocumentSource {
  readonly id = 'manual' as const;
  readonly capabilities = { listDocuments: true, fetchDocument: true, verifyAtSource: false };
  private readonly files = new Map<string, FetchedDocument & { ownerId: string }>();

  async authorize(): Promise<{ status: 'authorized'; consentId: null; simulated: true }> { return { status: 'authorized', consentId: null, simulated: true }; }
  async listDocuments(userId: string): Promise<RemoteDocument[]> { return [...this.files.values()].filter((file) => file.ownerId === userId).map((file) => RemoteDocumentSchema.parse(file.metadata)); }
  async fetchDocument(userId: string, reference: string): Promise<FetchedDocument> {
    const file = this.files.get(reference);
    if (!file || file.ownerId !== userId) throw new ConnectorError('NOT_FOUND', 'Uploaded document not found for this user.');
    return { reference: file.reference, bytes: file.bytes, mimeType: file.mimeType, metadata: file.metadata, sha256: file.sha256 };
  }
  async verifyAtSource(): Promise<SourceVerification> { return SourceVerificationSchema.parse({ matched: false, simulated: true, issuer: null, reference: null, reasonTrace: ['connector.manual.no_source_of_truth'] }); }

  ingest(input: { ownerId: string; fileName: string; mimeType: string; bytes: Uint8Array; documentType: string }): RemoteDocument {
    if (!allowedTypes.has(input.mimeType) || input.bytes.byteLength === 0 || input.bytes.byteLength > maxBytes) throw new ConnectorError('INVALID_FILE', 'Upload a non-empty PDF, JPG, or PNG file up to 10 MB.');
    const reference = `MANUAL-${crypto.randomUUID()}`;
    const metadata = RemoteDocumentSchema.parse({ reference, documentType: input.documentType, displayName: input.fileName, issuer: 'Applicant upload (not verified)', issuedAt: null, expiresAt: null, maskedIdentifier: null, simulated: true });
    this.files.set(reference, { ownerId: input.ownerId, reference, bytes: input.bytes, mimeType: input.mimeType, metadata, sha256: createHash('sha256').update(input.bytes).digest('hex') });
    return metadata;
  }
}

export const manualUploadAdapter = new ManualUploadAdapter();
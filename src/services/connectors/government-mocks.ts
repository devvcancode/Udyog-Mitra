import { RemoteDocumentSchema, SourceVerificationSchema, type DocumentSource, type FetchedDocument, type RemoteDocument, type SourceVerification, ConnectorError } from './types';

const sourceIds = ['gstn', 'udyam', 'mca', 'pan', 'landrecords', 'dept_issued'] as const;
const records = [
  { source: 'gstn', documentType: 'gst-certificate', reference: 'GSTN-DEMO-001', displayName: 'GST registration record (demo)', issuer: 'Mock GSTN', maskedIdentifier: '27XXXXX1234X1Z5' },
  { source: 'udyam', documentType: 'udyam-certificate', reference: 'UDYAM-DEMO-001', displayName: 'Udyam registration record (demo)', issuer: 'Mock Udyam', maskedIdentifier: 'UDYAM-MH-00-0000001' },
  { source: 'mca', documentType: 'company-master', reference: 'MCA-DEMO-001', displayName: 'Company master data (demo)', issuer: 'Mock MCA', maskedIdentifier: 'U00000MH2026PTC000001' },
  { source: 'pan', documentType: 'pan-status', reference: 'PAN-DEMO-001', displayName: 'PAN status check (demo)', issuer: 'Mock PAN source', maskedIdentifier: 'XXXPX****1F' },
  { source: 'landrecords', documentType: 'land-record-7-12', reference: 'LAND-DEMO-001', displayName: 'Land record extract (demo)', issuer: 'Mock Mahabhulekh', maskedIdentifier: 'SURVEY-00-DEMO' },
  { source: 'dept_issued', documentType: 'department-certificate', reference: 'CERT-DEMO-001', displayName: 'Department certificate (demo)', issuer: 'Mock Maharashtra department', maskedIdentifier: 'CERT-MH-DEMO-001' },
] as const;

export class MockGovernmentSource implements DocumentSource {
  readonly capabilities = { listDocuments: false, fetchDocument: false, verifyAtSource: true };
  constructor(readonly id: typeof sourceIds[number]) {}
  async authorize(): Promise<{ status: 'authorized' | 'consent-required' | 'not-configured'; consentId: string | null; simulated: boolean }> {
    return { status: 'not-configured', consentId: null, simulated: true };
  }
  async listDocuments(): Promise<RemoteDocument[]> { return []; }
  async fetchDocument(): Promise<FetchedDocument> { throw new ConnectorError('NOT_CONFIGURED', 'This mock source supports lookup only; document fetching is not enabled.'); }
  async verifyAtSource(document: RemoteDocument): Promise<SourceVerification> {
    const record = records.find((item) => item.source === this.id && item.reference === document.reference);
    const match = Boolean(record);
    return SourceVerificationSchema.parse({ matched: match, simulated: true, issuer: record?.issuer ?? null, reference: match ? document.reference : null, reasonTrace: [match ? `connector.mock_${this.id}.fixture_match` : `connector.mock_${this.id}.no_match`] });
  }
  getFixture(): RemoteDocument | null {
    const record = records.find((item) => item.source === this.id);
    return record ? RemoteDocumentSchema.parse({ ...record, issuedAt: null, expiresAt: null, simulated: true }) : null;
  }
}

export const mockGovernmentSources = Object.fromEntries(sourceIds.map((id) => [id, new MockGovernmentSource(id)])) as Record<typeof sourceIds[number], MockGovernmentSource>;
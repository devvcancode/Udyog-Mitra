import { createHash } from 'node:crypto';
import { consentLedger, type ConsentLedger, type ConsentRecord } from '../governance/consent';
import { ConnectorError, RemoteDocumentSchema, SourceVerificationSchema, type AuthorizationFlow, type DocumentSource, type FetchedDocument, type RemoteDocument, type SourceVerification } from './types';

const fakeDocuments: RemoteDocument[] = [
  { reference: 'DL-MOCK-PAN-01', documentType: 'pan', displayName: 'PAN card (demo)', issuer: 'Mock Income Tax Department', issuedAt: null, expiresAt: null, maskedIdentifier: 'XXXPX****1F', simulated: true },
  { reference: 'DL-MOCK-UDYAM-01', documentType: 'udyam-certificate', displayName: 'Udyam Registration Certificate (demo)', issuer: 'Mock Ministry of MSME', issuedAt: '2026-01-15', expiresAt: null, maskedIdentifier: 'UDYAM-MH-00-0000001', simulated: true },
  { reference: 'DL-MOCK-GST-01', documentType: 'gst-certificate', displayName: 'GST Registration Certificate (demo)', issuer: 'Mock GSTN', issuedAt: '2026-02-12', expiresAt: null, maskedIdentifier: '27XXXXX1234X1Z5', simulated: true },
  { reference: 'DL-MOCK-FIRE-01', documentType: 'fire-noc', displayName: 'Fire NOC (demo)', issuer: 'Mock Fire Services', issuedAt: '2026-03-02', expiresAt: '2027-03-02', maskedIdentifier: 'FIRE-MH-DEMO-001', simulated: true },
  { reference: 'DL-MOCK-LAND-01', documentType: 'land-record-7-12', displayName: '7/12 extract (demo)', issuer: 'Mock Maharashtra Land Records', issuedAt: '2026-01-08', expiresAt: null, maskedIdentifier: 'SURVEY-00-DEMO', simulated: true },
  { reference: 'DL-MOCK-FACTORY-01', documentType: 'factory-licence', displayName: 'Factory licence (demo)', issuer: 'Mock DISH Maharashtra', issuedAt: '2026-04-01', expiresAt: '2027-03-31', maskedIdentifier: 'FACTORY-DEMO-001', simulated: true },
  { reference: 'DL-MOCK-DL-01', documentType: 'driving-licence', displayName: 'Driving licence (demo)', issuer: 'Mock transport issuer', issuedAt: null, expiresAt: null, maskedIdentifier: 'MHXX-XXXX-1234', simulated: true },
].map((item) => RemoteDocumentSchema.parse(item));

export class MockDigiLockerSource implements DocumentSource {
  readonly id = 'digilocker' as const;
  readonly capabilities = { listDocuments: true, fetchDocument: true, verifyAtSource: true };
  constructor(private readonly ledger: ConsentLedger = consentLedger) {}

  async authorize(userId: string, consent: ConsentRecord | null): Promise<AuthorizationFlow> {
    const storedConsent = consent && this.ledger.list(userId).some((record) => record.id === consent.id);
    const currentConsent = consent && storedConsent && consent.subjectId === userId && consent.purpose === 'digilocker_fetch'
      && consent.revokedAt === null && Date.parse(consent.expiresAt) > Date.now()
      && this.ledger.hasConsent(userId, 'digilocker_fetch', 'list');
    return { status: currentConsent ? 'authorized' : 'consent-required', consentId: currentConsent ? consent.id : null, simulated: true };
  }

  async listDocuments(userId: string): Promise<RemoteDocument[]> {
    if (!this.ledger.hasConsent(userId, 'digilocker_fetch', 'list')) throw new ConnectorError('CONSENT_REQUIRED', 'Grant DigiLocker listing consent first.');
    return fakeDocuments.map((document) => RemoteDocumentSchema.parse(document));
  }

  async fetchDocument(userId: string, reference: string): Promise<FetchedDocument> {
    if (!this.ledger.hasConsent(userId, 'digilocker_fetch', 'fetch')) throw new ConnectorError('CONSENT_REQUIRED', 'Grant DigiLocker fetch consent first.');
    const metadata = fakeDocuments.find((document) => document.reference === reference);
    if (!metadata) throw new ConnectorError('NOT_FOUND', 'The mock connector document was not found.');
    const bytes = new TextEncoder().encode(`SYNTHETIC UDYOG MITRA DEMO DOCUMENT\nReference: ${reference}\nNo real identity data.`);
    return { reference, bytes, mimeType: 'application/pdf', metadata, sha256: createHash('sha256').update(bytes).digest('hex') };
  }

  async verifyAtSource(document: RemoteDocument): Promise<SourceVerification> {
    const matched = document.simulated && fakeDocuments.some((item) => item.reference === document.reference);
    return SourceVerificationSchema.parse({ matched, simulated: true, issuer: matched ? document.issuer : null, reference: matched ? document.reference : null, reasonTrace: [matched ? 'connector.mock_digilocker.fixture_match' : 'connector.mock_digilocker.no_match'] });
  }
}

export const mockDigiLockerSource: DocumentSource = new MockDigiLockerSource();

export function isDigiLockerLiveConfigured(): boolean {
  return Boolean(process.env.DIGILOCKER_CLIENT_ID && process.env.DIGILOCKER_CLIENT_SECRET && process.env.DIGILOCKER_REDIRECT_URI);
}
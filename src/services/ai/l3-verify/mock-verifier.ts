import { VerificationInputSchema, VerificationVerdictSchema, type VerificationInput, type VerificationProvider } from './contracts';

export class MockVerificationProvider implements VerificationProvider {
  async verify(rawInput: VerificationInput) {
    const input = VerificationInputSchema.parse(rawInput);
    const allowedType = ['application/pdf', 'image/jpeg', 'image/png'].includes(input.mimeType);
    const simulatedVerified = input.simulatedSource && input.sourceVerified;
    const status = !allowedType || input.byteSize > 10 * 1024 * 1024 ? 'REJECTED' : simulatedVerified ? 'VERIFIED' : 'NEEDS_REVIEW';
    const flags = [
      ...(!allowedType ? ['UNSUPPORTED_MEDIA_TYPE'] : []),
      ...(input.byteSize > 10 * 1024 * 1024 ? ['FILE_TOO_LARGE'] : []),
      ...(!simulatedVerified ? ['NO_LIVE_SOURCE_OF_TRUTH'] : []),
      ...(input.simulatedSource ? ['SIMULATED_DEMO_SOURCE'] : []),
    ];
    return VerificationVerdictSchema.parse({
      documentId: input.documentId, docType: input.docType, status, confidence: simulatedVerified && allowedType ? .92 : allowedType ? .35 : .05,
      extractedFields: input.extractedFields, checks: [
        { name: 'file-type', passed: allowedType, detail: allowedType ? 'Allowed upload type.' : 'Unsupported document type.', severity: allowedType ? 'info' : 'block' },
        { name: 'source-of-truth', passed: simulatedVerified, detail: simulatedVerified ? 'Simulated connector fixture matched.' : 'A live source check is not configured.', severity: simulatedVerified ? 'info' : 'warn' },
      ],
      evidence: simulatedVerified ? ['Synthetic fixture matched the mock source record.'] : ['No live source evidence was available.'],
      sourceOfTruth: simulatedVerified ? `${input.source} (simulated demo source)` : null, flags, validUntil: null,
      needsHuman: status !== 'VERIFIED' || !simulatedVerified,
      explanation: {
        en: simulatedVerified ? 'This is a simulated demo match, not a government verification.' : 'This file is not government-verified; an officer must review it.',
        mr: simulatedVerified ? 'ही नमुना जुळणी आहे; सरकारी पडताळणी नाही.' : 'या फाइलची सरकारी पडताळणी झालेली नाही; अधिकाऱ्याने तपासणे आवश्यक आहे.',
        hi: simulatedVerified ? 'यह केवल डेमो मिलान है, सरकारी सत्यापन नहीं।' : 'इस फाइल का सरकारी सत्यापन नहीं हुआ है; अधिकारी की जांच जरूरी है।',
      },
      simulated: true, reasonTrace: ['l3.mock.allowed_file_type_check', simulatedVerified ? 'l3.mock.synthetic_source_match' : 'l3.mock.live_source_unavailable'],
    });
  }
}

export const mockVerificationProvider: VerificationProvider = new MockVerificationProvider();
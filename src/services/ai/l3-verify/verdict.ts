import { VerificationVerdictSchema, type VerificationVerdict } from './contracts';

export function buildConservativeVerdict(input: { documentId: string; docType: string; confidence: number; checks: VerificationVerdict['checks']; evidence: string[]; sourceOfTruth: string | null; flags: string[]; simulated: boolean }): VerificationVerdict {
  const blocked = input.checks.some((check) => !check.passed && check.severity === 'block');
  const needsHuman = input.confidence < .75 || input.flags.some((flag) => flag.includes('TAMPER') || flag.includes('MISMATCH')) || !input.sourceOfTruth;
  const status = blocked ? 'REJECTED' : needsHuman ? 'NEEDS_REVIEW' : 'VERIFIED';
  return VerificationVerdictSchema.parse({
    ...input, status, needsHuman: needsHuman || status === 'REJECTED', validUntil: null,
    explanation: {
      en: needsHuman ? 'Evidence is incomplete; an officer must review this document.' : 'The configured source checks passed.',
      mr: needsHuman ? 'पुरावा अपूर्ण आहे; अधिकाऱ्याने कागदपत्र तपासणे आवश्यक आहे.' : 'कॉन्फिगर केलेल्या स्रोत तपासण्या पूर्ण झाल्या.',
      hi: needsHuman ? 'साक्ष्य अधूरे हैं; अधिकारी को दस्तावेज की समीक्षा करनी चाहिए।' : 'कॉन्फ़िगर की गई स्रोत जांच सफल रही।',
    },
    reasonTrace: [blocked ? 'l3.verdict.blocking_check_failed' : needsHuman ? 'l3.verdict.human_review_required' : 'l3.verdict.checks_passed'],
  });
}
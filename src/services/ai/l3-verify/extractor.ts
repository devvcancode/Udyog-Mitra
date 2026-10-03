export type ExtractionResult = { fields: Record<string, string | number | boolean | null>; confidence: number; needsHuman: true; reasonTrace: string[] };

export function extractDocumentFields(): ExtractionResult {
  return { fields: {}, confidence: 0, needsHuman: true, reasonTrace: ['l3.extractor.ocr_provider_required'] };
}
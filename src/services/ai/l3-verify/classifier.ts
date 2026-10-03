export type ClassificationResult = { docType: string; confidence: number; needsHuman: boolean; reasonTrace: string[] };

export function classifyDocument(fileName: string, mimeType: string): ClassificationResult {
  const name = fileName.toLowerCase();
  const known = [
    ['pan', /\bpan\b/], ['gst-certificate', /gst|goods.?services.?tax/], ['udyam-certificate', /udyam|msme/],
    ['fire-noc', /fire|agni|अग्नि/], ['factory-licence', /factory|कारखाना/], ['land-record-7-12', /7.?12|satbara|सातबारा/],
  ] as const;
  const match = known.find(([, pattern]) => pattern.test(name));
  const supported = ['application/pdf', 'image/jpeg', 'image/png'].includes(mimeType);
  return { docType: match?.[0] ?? 'unknown', confidence: match && supported ? .55 : .1, needsHuman: true, reasonTrace: [match ? 'l3.classifier.filename_hint_only' : 'l3.classifier.no_confident_match', 'l3.classifier.ocr_not_configured'] };
}
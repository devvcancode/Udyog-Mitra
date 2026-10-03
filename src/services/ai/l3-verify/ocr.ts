export type OcrResult = { text: string; confidence: number; provider: 'mock'; needsHuman: true; reasonTrace: string[] };

export interface OcrProvider {
  recognize(input: { documentId: string; mimeType: string; byteSize: number }): Promise<OcrResult>;
}

export class MockOcrProvider implements OcrProvider {
  async recognize(): Promise<OcrResult> {
    return { text: '', confidence: 0, provider: 'mock', needsHuman: true, reasonTrace: ['l3.ocr.mock_text_not_extracted'] };
  }
}

export const mockOcrProvider: OcrProvider = new MockOcrProvider();
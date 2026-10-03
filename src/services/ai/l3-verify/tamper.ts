export type TamperSignal = { flag: string; severity: 'info' | 'warn' | 'block'; reasonTrace: string };

export function inspectTamperMetadata(input: { byteSize: number; mimeType: string; declaredExtension: string }): TamperSignal[] {
  const extension = input.declaredExtension.toLowerCase();
  const mimeExtensionMatch = input.mimeType === 'application/pdf' ? extension === '.pdf'
    : input.mimeType === 'image/png' ? extension === '.png'
      : input.mimeType === 'image/jpeg' ? ['.jpg', '.jpeg'].includes(extension) : false;
  return [
    ...(input.byteSize <= 0 ? [{ flag: 'EMPTY_FILE', severity: 'block' as const, reasonTrace: 'l3.tamper.empty_file' }] : []),
    ...(!mimeExtensionMatch ? [{ flag: 'EXTENSION_MIME_MISMATCH', severity: 'warn' as const, reasonTrace: 'l3.tamper.extension_mime_mismatch' }] : []),
    { flag: 'PIXEL_FONT_ANALYSIS_NOT_CONFIGURED', severity: 'info', reasonTrace: 'l3.tamper.advanced_analysis_required' },
  ];
}
export type SpeechRecognitionAlternativeLike = { transcript: string };
export type SpeechRecognitionResultLike = ArrayLike<SpeechRecognitionAlternativeLike>;
export type SpeechRecognitionEventLike = { results: ArrayLike<SpeechRecognitionResultLike> };
export type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
};
export type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

export function createSpeechRecognition(windowObject: SpeechWindow, language: string): SpeechRecognitionLike | null {
  const Constructor = windowObject.SpeechRecognition ?? windowObject.webkitSpeechRecognition;
  if (!Constructor) return null;
  const recognition = new Constructor();
  recognition.lang = language;
  recognition.continuous = false;
  recognition.interimResults = false;
  return recognition;
}
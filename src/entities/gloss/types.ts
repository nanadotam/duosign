export interface GlossToken {
  id: string;
  text: string;
  isSpelled: boolean;
  isActive: boolean;
}

export interface TranslationResult {
  inputText: string;
  glossTokens: GlossToken[];
  timestamp: string;
  source: "typed" | "voice";
}

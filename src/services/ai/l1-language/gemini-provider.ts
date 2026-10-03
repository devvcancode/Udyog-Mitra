import { ExtractedSlotsSchema, IntentResultSchema, type GroundedFact, type LanguageProvider, type SupportedLanguage } from './contracts';
import { ensureGroundedNumbers } from './grounded-reply';
import { RuleBasedLanguageProvider } from './rule-based-provider';
import { maskObjectStrings, maskPii } from '../../governance/pii-mask';

const modelIntentSchema = {
  type: 'OBJECT', required: ['intent', 'confidence'], properties: {
    intent: { type: 'STRING', enum: ['find_approvals', 'timeline_estimate', 'track_application', 'document_help', 'fetch_documents', 'verify_document', 'scheme_match', 'grievance', 'talk_to_human', 'smalltalk'] },
    confidence: { type: 'NUMBER' },
  },
};
const modelSlotsSchema = {
  type: 'OBJECT', required: ['sector', 'district', 'taluka', 'activity', 'investmentLakhs', 'applicationId', 'documentType', 'approvalId'], properties: {
    sector: { type: 'STRING', nullable: true }, district: { type: 'STRING', nullable: true }, taluka: { type: 'STRING', nullable: true },
    activity: { type: 'STRING', nullable: true, enum: ['manufacturing', 'service', 'trading'] }, investmentLakhs: { type: 'NUMBER', nullable: true },
    applicationId: { type: 'STRING', nullable: true }, documentType: { type: 'STRING', nullable: true }, approvalId: { type: 'STRING', nullable: true },
  },
};

export class GeminiLanguageProvider implements LanguageProvider {
  private readonly fallback = new RuleBasedLanguageProvider();
  private readonly apiKey = process.env.GEMINI_API_KEY;
  private readonly model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

  private async generate(prompt: string, responseSchema?: object, model = this.model): Promise<string> {
    if (!this.apiKey) throw new Error('GEMINI_API_KEY is not configured.');
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`, {
      method: 'POST', signal: AbortSignal.timeout(12_000), headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: responseSchema ? { responseMimeType: 'application/json', responseSchema } : { temperature: .2 } }),
    });
    if (!response.ok) throw new Error(`Gemini request failed with status ${response.status}.`);
    const payload = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('');
    if (!text) throw new Error('Gemini returned no content.');
    return text;
  }

  async detectLanguage(message: string): Promise<SupportedLanguage> { return this.fallback.detectLanguage(message); }

  async classifyIntent(message: string, language: SupportedLanguage) {
    const fallback = await this.fallback.classifyIntent(message, language);
    try {
      const safeMessage = maskPii(message).text;
      const text = await this.generate(`Classify the user's intent. Return only schema JSON. Do not answer factual questions. User language: ${language}. Message: ${safeMessage}`, modelIntentSchema);
      const parsed = IntentResultSchema.safeParse({ ...JSON.parse(text), reasonTrace: ['l1.gemini.structured_intent'] });
      return parsed.success ? parsed.data : fallback;
    } catch { return fallback; }
  }

  async extractSlots(message: string, language: SupportedLanguage) {
    const fallback = await this.fallback.extractSlots(message, language);
    try {
      const safeMessage = maskPii(message).text;
      const text = await this.generate(`Extract only explicitly stated project slots. Use null when absent. Convert investment to lakh rupees. Do not infer approvals, laws, fees or timelines. Language: ${language}. Message: ${safeMessage}`, modelSlotsSchema);
      const parsed = ExtractedSlotsSchema.safeParse(JSON.parse(text));
      return parsed.success ? { ...fallback, ...Object.fromEntries(Object.entries(parsed.data).map(([key, value]) => [key, value ?? fallback[key as keyof typeof fallback]])) } as typeof fallback : fallback;
    } catch { return fallback; }
  }

  async generateGroundedReply(input: { language: SupportedLanguage; facts: GroundedFact[]; handoff: boolean }): Promise<string> {
    const fallback = await this.fallback.generateGroundedReply(input);
    if (input.handoff || input.facts.length === 0) return fallback;
    const factJson = JSON.stringify(input.facts);
    try {
      const reply = await this.generate(`Answer in ${input.language}. Use only the facts below; do not add any figures, dates, fees, legal requirements, or verification claims. If the facts do not answer the question, say to contact a human officer. State guidance only, not legal advice. Facts: ${factJson}`);
      return ensureGroundedNumbers(reply, input.facts) ? reply : fallback;
    } catch { return fallback; }
  }

  async simplifyOfficerQuery(query: string, language: SupportedLanguage): Promise<string> {
    const fallback = await this.fallback.simplifyOfficerQuery(query, language);
    try {
      const reply = await this.generate(`Simplify this officer query in ${language}. Preserve every requirement and number; add no facts. Query: ${maskPii(query).text}`, undefined, process.env.GEMINI_PRO_MODEL || this.model);
      return ensureGroundedNumbers(reply, [{ key: 'originalQuery', value: query, source: null }]) ? reply : fallback;
    } catch { return fallback; }
  }

  async draftQueryResponse(deficiencies: string[], facts: GroundedFact[], language: SupportedLanguage): Promise<string> {
    try {
      const safeInputs = maskObjectStrings({ facts, deficiencies }).value;
      const reply = await this.generate(`Draft a concise applicant response in ${language}. Only use the provided facts and deficiency list; do not claim completion of unverified actions. Facts: ${JSON.stringify(safeInputs.facts)} Deficiencies: ${JSON.stringify(safeInputs.deficiencies)}`, undefined, process.env.GEMINI_PRO_MODEL || this.model);
      return ensureGroundedNumbers(reply, facts) ? reply : this.fallback.draftQueryResponse(deficiencies, facts, language);
    } catch { return this.fallback.draftQueryResponse(deficiencies, facts, language); }
  }

  async summarizeForVoice(reply: string, language: SupportedLanguage): Promise<string> {
    const fallback = await this.fallback.summarizeForVoice(reply, language);
    try {
      const summary = await this.generate(`Summarize in at most two short spoken sentences in ${language}. Preserve only facts and numbers already present. Text: ${maskPii(reply).text}`, undefined, process.env.GEMINI_PRO_MODEL || this.model);
      return ensureGroundedNumbers(summary, [{ key: 'sourceReply', value: reply, source: null }]) ? summary : fallback;
    } catch { return fallback; }
  }
}

export function createLanguageProvider(externalConsent: boolean): LanguageProvider {
  return externalConsent && process.env.GEMINI_API_KEY ? new GeminiLanguageProvider() : new RuleBasedLanguageProvider();
}
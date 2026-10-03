import { ExtractedSlotsSchema, IntentResultSchema, type ExtractedSlots, type GroundedFact, type LanguageProvider, type SupportedLanguage } from './contracts';
import { ensureGroundedNumbers } from './grounded-reply';
import { approvals } from '@/lib/demo-data';

const digitMap: Record<string, string> = { '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9' };
const normalizeDigits = (value: string) => value.replace(/[०-९]/g, (digit) => digitMap[digit] ?? digit);

const districts = [
  { names: ['pune', 'पुणे'], district: 'Pune' }, { names: ['nashik', 'नाशिक'], district: 'Nashik' },
  { names: ['nagpur', 'नागपूर', 'नागपुर'], district: 'Nagpur' }, { names: ['thane', 'ठाणे'], district: 'Thane' },
  { names: ['bhiwandi', 'भिवंडी'], district: 'Thane' }, { names: ['kolhapur', 'कोल्हापूर', 'कोल्हापुर'], district: 'Kolhapur' },
  { names: ['raigad', 'रायगड', 'रायगढ़'], district: 'Raigad' }, { names: ['chhatrapati sambhajinagar', 'sambhajinagar', 'छत्रपती संभाजीनगर'], district: 'Chhatrapati Sambhajinagar' },
];

function keywords(message: string, terms: string[]): boolean { return terms.some((term) => message.includes(term)); }

function localizedFactLabel(key: string, language: SupportedLanguage): string {
  const labels: Record<string, Record<SupportedLanguage, string>> = {
    requiredApprovals: { en: 'Likely approvals', mr: 'संभाव्य मंजुऱ्या', hi: 'संभावित स्वीकृतियां' },
    medianJourneyDays: { en: 'Likely journey days', mr: 'प्रवासाचे संभाव्य दिवस', hi: 'संभावित यात्रा के दिन' },
    conservativeJourneyDays: { en: 'Conservative journey days', mr: 'सावध अंदाजाचे दिवस', hi: 'सावधानीपूर्ण अनुमान के दिन' },
    potentialIllustrativeSchemes: { en: 'Potential illustrative schemes', mr: 'संभाव्य नमुना योजना', hi: 'संभावित उदाहरण योजनाएं' },
    applicationStatus: { en: 'Application status', mr: 'अर्जाची स्थिती', hi: 'आवेदन की स्थिति' },
    availableDemoDocuments: { en: 'Available demo documents', mr: 'उपलब्ध नमुना कागदपत्रे', hi: 'उपलब्ध डेमो दस्तावेज' },
    verificationStatus: { en: 'Verification status', mr: 'पडताळणी स्थिती', hi: 'सत्यापन स्थिति' },
    verificationConfidence: { en: 'Verification confidence', mr: 'पडताळणी विश्वास पातळी', hi: 'सत्यापन विश्वास स्तर' },
    simulated: { en: 'Simulated result', mr: 'नमुना निकाल', hi: 'डेमो परिणाम' },
  };
  return labels[key]?.[language] ?? key;
}

export class RuleBasedLanguageProvider implements LanguageProvider {
  async detectLanguage(message: string): Promise<SupportedLanguage> {
    const text = message.toLowerCase();
    if (keywords(text, ['maza', 'majha', 'madhe', 'aahe', 'kara', 'karaycha', 'mala', 'kuthe', 'kiti'])) return 'mr';
    if (keywords(text, ['mera', 'mein', 'hai', 'chahiye', 'kaise', 'kripya', 'kitne', 'kahan'])) return 'hi';
    if (/[\u0900-\u097F]/.test(text)) {
      if (/[ळॲ]/u.test(text) || keywords(text, ['आहे', 'माझा', 'माझ्या', 'करा', 'मंजुरी', 'उद्योग', 'नाही', 'किती'])) return 'mr';
      return 'hi';
    }
    return 'en';
  }

  async classifyIntent(message: string, _language: SupportedLanguage) {
    void _language;
    const text = message.toLowerCase();
    const routes: Array<[Parameters<LanguageProvider['classifyIntent']>[0], string[]]> = [
      ['talk_to_human', ['human', 'officer', 'helpline', 'agent', 'अधिकारी', 'माणूस', 'मानव', 'बोला', 'baat karo', 'adhikari']],
      ['track_application', ['track', 'status', 'application id', 'अर्ज स्थिती', 'अर्जाचा मागोवा', 'आवेदन की स्थिति', 'आवेदन ट्रैक', 'track application']],
      ['timeline_estimate', ['timeline', 'how long', 'days', 'किती दिवस', 'कालावधी', 'कितने दिन', 'समय-सीमा', 'time lagel', 'kiti divas']],
      ['fetch_documents', ['fetch', 'digilocker', 'pull documents', 'कागदपत्र आणा', 'दस्तऐवज मिळवा', 'दस्तावेज लाएं', 'document manga', 'documents आण']],
      ['verify_document', ['verify document', 'check document', 'पडताळ', 'सत्यापित', 'verify my', 'check my pan', 'verify pan', 'gstin']],
      ['document_help', ['document', 'paperwork', 'कागदपत्र', 'दस्तऐवज', 'दस्तावेज', 'papers']],
      ['scheme_match', ['scheme', 'incentive', 'subsidy', 'योजना', 'अनुदान', 'प्रोत्साहन', 'rojgar', 'subsidy']],
      ['grievance', ['grievance', 'complaint', 'शिकायत', 'तक्रार', 'grievance']],
      ['find_approvals', ['approval', 'licence', 'license', 'n.o.c', 'noc', 'मंजुरी', 'परवाना', 'स्वीकृति', 'अनुमति', 'registration', 'maza unit', 'my unit']],
    ];
    const match = routes.find(([, terms]) => keywords(text, terms));
    return IntentResultSchema.parse({ intent: match?.[0] ?? 'smalltalk', confidence: match ? .82 : .45, reasonTrace: [match ? 'l1.rule.keyword_match' : 'l1.rule.no_intent_match'] });
  }

  async extractSlots(message: string, _language: SupportedLanguage): Promise<ExtractedSlots> {
    void _language;
    const text = normalizeDigits(message.toLowerCase());
    const investment = text.match(/(\d+(?:\.\d+)?)\s*(lakh|lac|लाख|लक्ष|crore|करोड़|कोटी|करोड)/i);
    let investmentLakhs: number | null = null;
    if (investment) investmentLakhs = Number(investment[1]) * (/crore|करोड़|कोटी|करोड/i.test(investment[2]) ? 100 : 1);
    const district = districts.find((item) => item.names.some((name) => text.includes(name)));
    const applicationId = message.match(/\bUM-\d{4}-\d+\b/i)?.[0].toUpperCase() ?? null;
    const activity = keywords(text, ['manufactur', 'factory', 'उत्पादन', 'निर्माण', 'unit', 'कारखाना']) ? 'manufacturing'
      : keywords(text, ['service', 'सेवा']) ? 'service'
        : keywords(text, ['trading', 'दुकान', 'व्यापार']) ? 'trading' : null;
    const sector = keywords(text, ['food', 'अन्न', 'खाद्य']) ? 'food processing'
      : keywords(text, ['textile', 'वस्त्र', 'कापड']) ? 'textiles'
        : keywords(text, ['auto', 'automobile', 'वाहन', 'ऑटो']) ? 'automotive' : null;
    const taluka = /(?:taluka|taluka of|तालुका|तहसील)\s+([\p{L}-]+)/iu.exec(message)?.[1] ?? null;
    const documentType = keywords(text, ['fire noc', 'अग्निशमन']) ? 'fire-noc'
      : keywords(text, ['gst', 'जीएसटी']) ? 'gst-certificate'
        : keywords(text, ['udyam', 'उद्यम']) ? 'udyam-certificate'
          : keywords(text, ['7/12', 'सातबारा']) ? 'land-record' : null;
    const approvalId = approvals.find((approval) => {
      const name = approval.name.en.toLowerCase();
      if (approval.id === 'fire') return keywords(text, ['fire noc', 'fire no objection', 'अग्निशमन']);
      if (approval.id === 'cte') return keywords(text, ['consent to establish', 'स्थापना संमती', 'स्थापना की सहमति']);
      if (approval.id === 'cto') return keywords(text, ['consent to operate', 'संचालन संमती', 'संचालन की सहमति']);
      return text.includes(name);
    })?.id ?? null;
    return ExtractedSlotsSchema.parse({ sector, district: district?.district ?? null, taluka, activity, investmentLakhs, applicationId, documentType, approvalId });
  }

  async generateGroundedReply(input: { language: SupportedLanguage; facts: GroundedFact[]; handoff: boolean }): Promise<string> {
    const prefix = input.language === 'mr' ? 'उपलब्ध माहिती:' : input.language === 'hi' ? 'उपलब्ध जानकारी:' : 'Available guidance:';
    const suffix = input.language === 'mr' ? 'हे केवळ मार्गदर्शन आहे; कायदेशीर सल्ला नाही.' : input.language === 'hi' ? 'यह केवल मार्गदर्शन है, कानूनी सलाह नहीं।' : 'Guidance only, not legal advice.';
    if (input.handoff || input.facts.length === 0) {
      return input.language === 'mr' ? 'या प्रश्नासाठी एक खिडकी मदत केंद्राशी संपर्क करा. केवळ मार्गदर्शन; कायदेशीर सल्ला नाही.' : input.language === 'hi' ? 'इस प्रश्न के लिए सहायता केंद्र से संपर्क करें। केवल मार्गदर्शन, कानूनी सलाह नहीं।' : 'Please contact the single-window helpdesk for case-specific guidance. Guidance only, not legal advice.';
    }
    const answer = `${prefix} ${input.facts.map((fact) => `${localizedFactLabel(fact.key, input.language)}: ${fact.value}`).join('; ')}. ${suffix}`;
    return ensureGroundedNumbers(answer, input.facts) ?? suffix;
  }

  async simplifyOfficerQuery(query: string, language: SupportedLanguage): Promise<string> {
    const lead = language === 'mr' ? 'कृती:' : language === 'hi' ? 'क्या करें:' : 'What to do:';
    return `${lead} ${query.trim()}`;
  }

  async draftQueryResponse(deficiencies: string[], facts: GroundedFact[], language: SupportedLanguage): Promise<string> {
    const prefix = language === 'mr' ? 'प्रत्येक मुद्द्याचे उत्तर द्या:' : language === 'hi' ? 'हर बिंदु का जवाब दें:' : 'Please address each item:';
    const safeItems = deficiencies.map((item) => ensureGroundedNumbers(item, facts) ?? item.replace(/\d[\d,.]*/g, '[value]'));
    return `${prefix} ${safeItems.join('; ')}`;
  }

  async summarizeForVoice(reply: string, _language: SupportedLanguage): Promise<string> {
    void _language;
    return reply.length <= 260 ? reply : `${reply.slice(0, 257).trimEnd()}...`;
  }
}
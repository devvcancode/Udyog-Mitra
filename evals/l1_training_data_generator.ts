import { pathToFileURL } from 'node:url';
import type { Intent, SupportedLanguage } from '../src/services/ai/l1-language/contracts';

const examples: Record<SupportedLanguage, Record<Intent, { prompt: string; response: string }>> = {
  en: {
    find_approvals: { prompt: 'I want to start a small manufacturing unit. What should I do first?', response: 'I can help build an illustrative checklist. Tell me your business activity and location.' },
    timeline_estimate: { prompt: 'How long could my approval journey take?', response: 'I can request an estimate from the rule service. It is guidance, not a statutory promise.' },
    track_application: { prompt: 'Can you check my application status?', response: 'Please sign in and share your application ID. I will only access records you are authorized to see.' },
    document_help: { prompt: 'Which papers do I need to prepare?', response: 'I can show the documents listed for your selected approvals. Requirements can vary by project.' },
    fetch_documents: { prompt: 'Can I get my documents from DigiLocker?', response: 'I can show the demo connector after you grant purpose-specific consent. Live access needs approved partner setup.' },
    verify_document: { prompt: 'Please verify this certificate.', response: 'I can run the configured checks. A demo result is not government verification; uncertain cases go to an officer.' },
    scheme_match: { prompt: 'What incentives might fit my business?', response: 'I can compare your profile with illustrative scheme rules and explain what information is missing.' },
    grievance: { prompt: 'I need to complain about a delay.', response: 'I can guide you to the grievance form and help identify the relevant application or department.' },
    talk_to_human: { prompt: 'I want to speak with an officer.', response: 'I will direct you to the single-window helpdesk for human support.' },
    smalltalk: { prompt: 'Hello, what can you help me with?', response: 'I can help you find approvals, understand documents, estimate a journey, or reach an officer.' },
  },
  mr: {
    find_approvals: { prompt: 'मला छोटा उत्पादन उद्योग सुरू करायचा आहे. आधी काय करू?', response: 'मी नमुना मंजुरी यादी तयार करण्यात मदत करतो. व्यवसाय प्रकार आणि ठिकाण सांगा.' },
    timeline_estimate: { prompt: 'माझ्या मंजुरी प्रवासाला किती वेळ लागू शकतो?', response: 'मी नियम सेवेकडून अंदाज मागवू शकतो. हा मार्गदर्शक अंदाज आहे, वैधानिक हमी नाही.' },
    track_application: { prompt: 'माझ्या अर्जाची स्थिती तपासाल का?', response: 'कृपया लॉग इन करून अर्ज क्रमांक द्या. तुम्हाला परवानगी असलेली माहितीच दाखवली जाईल.' },
    document_help: { prompt: 'कोणती कागदपत्रे तयार ठेवू?', response: 'निवडलेल्या मंजुऱ्यांसाठी नमुना यादी दाखवतो. आवश्यकता प्रकल्पानुसार बदलू शकतात.' },
    fetch_documents: { prompt: 'DigiLocker मधून कागदपत्रे मिळतील का?', response: 'उद्देशानुसार संमती दिल्यावर नमुना कनेक्टर दाखवू शकतो. प्रत्यक्ष वापरासाठी भागीदार मंजुरी आवश्यक आहे.' },
    verify_document: { prompt: 'हे प्रमाणपत्र पडताळा.', response: 'मी उपलब्ध तपासण्या चालवू शकतो. नमुना निकाल सरकारी पडताळणी नाही; अनिश्चित प्रकरण अधिकाऱ्याकडे जाते.' },
    scheme_match: { prompt: 'माझ्या व्यवसायाला कोणत्या योजना लागू होऊ शकतात?', response: 'मी प्रोफाइलची नमुना योजना नियमांशी तुलना करून उणीव माहिती सांगेन.' },
    grievance: { prompt: 'विलंबाबद्दल तक्रार करायची आहे.', response: 'तक्रार अर्ज आणि संबंधित विभाग शोधण्यात मी मदत करतो.' },
    talk_to_human: { prompt: 'मला अधिकाऱ्याशी बोलायचे आहे.', response: 'मानवी मदतीसाठी मी एक खिडकी मदत केंद्राकडे मार्गदर्शन करतो.' },
    smalltalk: { prompt: 'नमस्कार, तुम्ही कशी मदत करू शकता?', response: 'मंजुऱ्या, कागदपत्रे, प्रवासाचा अंदाज किंवा अधिकाऱ्याशी संपर्क यात मी मदत करू शकतो.' },
  },
  hi: {
    find_approvals: { prompt: 'मुझे छोटी विनिर्माण इकाई शुरू करनी है। पहले क्या करूं?', response: 'मैं उदाहरण स्वीकृति सूची बनाने में मदद कर सकता हूं। व्यवसाय गतिविधि और स्थान बताएं।' },
    timeline_estimate: { prompt: 'मेरी स्वीकृति यात्रा में कितना समय लग सकता है?', response: 'मैं नियम सेवा से अनुमान ले सकता हूं। यह मार्गदर्शन है, वैधानिक वादा नहीं।' },
    track_application: { prompt: 'क्या आप मेरा आवेदन स्टेटस देख सकते हैं?', response: 'कृपया लॉग इन करके आवेदन आईडी दें। आप केवल वही रिकॉर्ड देख पाएंगे जिसकी अनुमति है।' },
    document_help: { prompt: 'मुझे कौन-से दस्तावेज तैयार रखने चाहिए?', response: 'मैं चुनी हुई स्वीकृतियों के लिए उदाहरण सूची दिखाऊंगा। आवश्यकताएं परियोजना के अनुसार बदल सकती हैं।' },
    fetch_documents: { prompt: 'क्या DigiLocker से दस्तावेज मिल सकते हैं?', response: 'उद्देश्य-विशिष्ट सहमति के बाद मैं डेमो कनेक्टर दिखा सकता हूं। लाइव उपयोग के लिए भागीदार स्वीकृति जरूरी है।' },
    verify_document: { prompt: 'इस प्रमाणपत्र को सत्यापित करें।', response: 'मैं उपलब्ध जांच चला सकता हूं। डेमो परिणाम सरकारी सत्यापन नहीं है; अनिश्चित मामले अधिकारी को भेजे जाते हैं।' },
    scheme_match: { prompt: 'मेरे व्यवसाय के लिए कौन-सी योजनाएं हो सकती हैं?', response: 'मैं प्रोफाइल की उदाहरण योजना नियमों से तुलना करके बताऊंगा कि कौन-सी जानकारी बाकी है।' },
    grievance: { prompt: 'देरी के बारे में शिकायत करनी है।', response: 'मैं शिकायत फॉर्म और संबंधित विभाग ढूंढने में मदद कर सकता हूं।' },
    talk_to_human: { prompt: 'मुझे अधिकारी से बात करनी है।', response: 'मानवीय सहायता के लिए मैं आपको सिंगल-विंडो हेल्पडेस्क तक पहुंचाता हूं।' },
    smalltalk: { prompt: 'नमस्ते, आप किस काम में मदद कर सकते हैं?', response: 'मैं स्वीकृतियां, दस्तावेज, अनुमान या अधिकारी से संपर्क खोजने में मदद कर सकता हूं।' },
  },
};

export function buildTuningJsonl(): string {
  const rows: string[] = [];
  for (const language of ['en', 'mr', 'hi'] as const) {
    for (const [intent, example] of Object.entries(examples[language]) as Array<[Intent, { prompt: string; response: string }]>) {
      const row = {
        contents: [
          { role: 'user', parts: [{ text: `[language=${language}] [intent=${intent}] ${example.prompt}` }] },
          { role: 'model', parts: [{ text: example.response }] },
        ],
      };
      rows.push(JSON.stringify(row));
    }
  }
  return rows.join('\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) console.log(buildTuningJsonl());
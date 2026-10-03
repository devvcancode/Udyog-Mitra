export type LocaleText = { en: string; mr: string; hi: string };
export type Approval = {
  id: string;
  name: LocaleText;
  department: string;
  stage: 'Planning' | 'Pre-establishment' | 'Pre-operation' | 'Operational';
  days: number;
  fee: number;
  tags: string[];
  documents: LocaleText[];
  deemedEligible: boolean;
};

const text = (en: string, mr: string, hi: string): LocaleText => ({ en, mr, hi });

export const approvals: Approval[] = [
  { id: 'udyam', name: text('Udyam Registration', 'उद्यम नोंदणी', 'उद्यम पंजीकरण'), department: 'MSME', stage: 'Planning', days: 1, fee: 0, tags: ['all', 'msme'], documents: [text('Aadhaar and PAN', 'आधार आणि पॅन', 'आधार और पैन')], deemedEligible: false },
  { id: 'gst', name: text('GST Registration', 'जीएसटी नोंदणी', 'जीएसटी पंजीकरण'), department: 'GST', stage: 'Planning', days: 3, fee: 0, tags: ['all'], documents: [text('PAN and business address proof', 'पॅन आणि व्यवसाय पत्त्याचा पुरावा', 'पैन और व्यवसाय पते का प्रमाण')], deemedEligible: false },
  { id: 'pt', name: text('Professional Tax Enrolment', 'व्यावसायिक कर नोंदणी', 'व्यावसायिक कर नामांकन'), department: 'Maharashtra GST', stage: 'Planning', days: 7, fee: 0, tags: ['all'], documents: [text('PAN and incorporation proof', 'पॅन आणि स्थापना पुरावा', 'पैन और स्थापना प्रमाण')], deemedEligible: false },
  { id: 'shop', name: text('Shops and Establishments Registration', 'दुकाने व आस्थापना नोंदणी', 'दुकान एवं प्रतिष्ठान पंजीकरण'), department: 'Labour', stage: 'Pre-establishment', days: 7, fee: 500, tags: ['all', 'service', 'trading'], documents: [text('Occupancy proof and employee details', 'वापर पुरावा आणि कर्मचारी तपशील', 'कब्जा प्रमाण और कर्मचारी विवरण')], deemedEligible: true },
  { id: 'building', name: text('Building Plan Approval', 'इमारत आराखडा मंजुरी', 'भवन मानचित्र स्वीकृति'), department: 'Local Body', stage: 'Pre-establishment', days: 30, fee: 5000, tags: ['manufacturing', 'land'], documents: [text('Architectural plans and land title', 'वास्तु आराखडे आणि जमीन मालकी', 'वास्तु योजना और भूमि स्वामित्व')], deemedEligible: false },
  { id: 'fire', name: text('Fire NOC', 'अग्निशमन ना-हरकत प्रमाणपत्र', 'अग्निशमन अनापत्ति प्रमाणपत्र'), department: 'Fire Services', stage: 'Pre-establishment', days: 15, fee: 2500, tags: ['manufacturing', 'large', 'building'], documents: [text('Fire plan and building plan approval', 'अग्निशमन व इमारत आराखडा', 'अग्नि योजना और भवन मानचित्र')], deemedEligible: false },
  { id: 'cte', name: text('Consent to Establish', 'स्थापना संमती', 'स्थापना की सहमति'), department: 'MPCB', stage: 'Pre-establishment', days: 30, fee: 10000, tags: ['manufacturing', 'pollution'], documents: [text('Project report and site plan', 'प्रकल्प अहवाल आणि जागेचा आराखडा', 'परियोजना रिपोर्ट और स्थल योजना')], deemedEligible: true },
  { id: 'electricity', name: text('Electricity Connection / Load Sanction', 'वीज जोडणी / भार मंजुरी', 'बिजली कनेक्शन / भार स्वीकृति'), department: 'MSEDCL', stage: 'Pre-establishment', days: 21, fee: 15000, tags: ['manufacturing', 'power'], documents: [text('Load requirement and ownership proof', 'भार आवश्यकता आणि मालकी पुरावा', 'भार आवश्यकता और स्वामित्व प्रमाण')], deemedEligible: false },
  { id: 'water', name: text('Industrial Water Supply Permission', 'औद्योगिक पाणीपुरवठा परवानगी', 'औद्योगिक जलापूर्ति अनुमति'), department: 'MIDC / Water Resources', stage: 'Pre-establishment', days: 20, fee: 5000, tags: ['manufacturing', 'water'], documents: [text('Water balance and site plan', 'पाणी ताळेबंद आणि जागेचा आराखडा', 'जल संतुलन और स्थल योजना')], deemedEligible: false },
  { id: 'land', name: text('Land Use / NA Permission', 'जमीन वापर / अकृषिक परवानगी', 'भूमि उपयोग / अकृषि अनुमति'), department: 'Revenue', stage: 'Pre-establishment', days: 45, fee: 7500, tags: ['land'], documents: [text('Land title and project layout', 'जमीन मालकी आणि प्रकल्प आराखडा', 'भूमि स्वामित्व और परियोजना लेआउट')], deemedEligible: false },
  { id: 'factory', name: text('Factory Plan Approval and Licence', 'कारखाना आराखडा मंजुरी व परवाना', 'कारखाना मानचित्र स्वीकृति एवं लाइसेंस'), department: 'DISH', stage: 'Pre-operation', days: 30, fee: 12000, tags: ['manufacturing', 'large', 'workers'], documents: [text('Factory plans and machinery list', 'कारखाना आराखडे आणि यंत्रसामग्री यादी', 'कारखाना योजना और मशीनरी सूची')], deemedEligible: false },
  { id: 'cto', name: text('Consent to Operate', 'कार्य संचालन संमती', 'संचालन की सहमति'), department: 'MPCB', stage: 'Pre-operation', days: 30, fee: 15000, tags: ['manufacturing', 'pollution'], documents: [text('Consent to Establish and pollution controls', 'स्थापना संमती आणि प्रदूषण नियंत्रण', 'स्थापना सहमति और प्रदूषण नियंत्रण')], deemedEligible: true },
  { id: 'trade', name: text('Trade Licence', 'व्यापार परवाना', 'व्यापार लाइसेंस'), department: 'Local Body', stage: 'Pre-operation', days: 10, fee: 1000, tags: ['trading', 'service'], documents: [text('Premises proof and business details', 'जागेचा पुरावा आणि व्यवसाय तपशील', 'परिसर प्रमाण और व्यवसाय विवरण')], deemedEligible: true },
  { id: 'clra', name: text('Contract Labour Licence (CLRA)', 'कंत्राटी कामगार परवाना (CLRA)', 'ठेका श्रम लाइसेंस (CLRA)'), department: 'Labour', stage: 'Pre-operation', days: 15, fee: 2000, tags: ['workers', 'manufacturing'], documents: [text('Contractor details and workforce plan', 'कंत्राटदार तपशील आणि मनुष्यबळ योजना', 'ठेकेदार विवरण और कार्यबल योजना')], deemedEligible: false },
  { id: 'pfesic', name: text('PF and ESIC Registration', 'पीएफ आणि ईएसआयसी नोंदणी', 'पीएफ और ईएसआईसी पंजीकरण'), department: 'EPFO / ESIC', stage: 'Pre-operation', days: 10, fee: 0, tags: ['workers'], documents: [text('Employee roster and PAN', 'कर्मचारी यादी आणि पॅन', 'कर्मचारी सूची और पैन')], deemedEligible: false },
  { id: 'boiler', name: text('Boiler Registration', 'बॉयलर नोंदणी', 'बॉयलर पंजीकरण'), department: 'Boiler Directorate', stage: 'Pre-operation', days: 21, fee: 5000, tags: ['boiler'], documents: [text('Boiler specifications and test certificate', 'बॉयलर तपशील आणि चाचणी प्रमाणपत्र', 'बॉयलर विनिर्देश और परीक्षण प्रमाणपत्र')], deemedEligible: false },
  { id: 'hazardous', name: text('Hazardous Waste Authorisation', 'घातक कचरा प्राधिकरण', 'खतरनाक अपशिष्ट प्राधिकरण'), department: 'MPCB', stage: 'Pre-operation', days: 30, fee: 8000, tags: ['hazardous', 'pollution'], documents: [text('Waste inventory and disposal plan', 'कचरा यादी आणि विल्हेवाट योजना', 'अपशिष्ट सूची और निपटान योजना')], deemedEligible: false },
  { id: 'plastic', name: text('Plastic Waste EPR Registration', 'प्लास्टिक कचरा EPR नोंदणी', 'प्लास्टिक अपशिष्ट EPR पंजीकरण'), department: 'MPCB / CPCB', stage: 'Operational', days: 30, fee: 10000, tags: ['hazardous'], documents: [text('Annual waste estimate', 'वार्षिक कचरा अंदाज', 'वार्षिक अपशिष्ट अनुमान')], deemedEligible: false },
  { id: 'occupancy', name: text('Occupancy Certificate', 'भोगवटा प्रमाणपत्र', 'अधिभोग प्रमाणपत्र'), department: 'Local Body', stage: 'Pre-operation', days: 15, fee: 3000, tags: ['building'], documents: [text('Completion certificate and fire compliance', 'पूर्णत्व प्रमाणपत्र आणि अग्निशमन अनुपालन', 'पूर्णता प्रमाणपत्र और अग्नि अनुपालन')], deemedEligible: false },
  { id: 'factoryinspection', name: text('Factory Safety Inspection', 'कारखाना सुरक्षा तपासणी', 'कारखाना सुरक्षा निरीक्षण'), department: 'DISH', stage: 'Pre-operation', days: 14, fee: 0, tags: ['manufacturing', 'workers'], documents: [text('Safety plan and equipment certificates', 'सुरक्षा योजना आणि उपकरण प्रमाणपत्रे', 'सुरक्षा योजना और उपकरण प्रमाणपत्र')], deemedEligible: false },
  { id: 'fssai', name: text('FSSAI Licence', 'FSSAI परवाना', 'FSSAI लाइसेंस'), department: 'Food Safety', stage: 'Pre-operation', days: 15, fee: 2500, tags: ['food'], documents: [text('Food safety plan and premises proof', 'अन्न सुरक्षा योजना आणि जागेचा पुरावा', 'खाद्य सुरक्षा योजना और परिसर प्रमाण')], deemedEligible: false },
  { id: 'boilerinspection', name: text('Boiler Fitness Inspection', 'बॉयलर क्षमता तपासणी', 'बॉयलर फिटनेस निरीक्षण'), department: 'Boiler Directorate', stage: 'Operational', days: 10, fee: 2500, tags: ['boiler'], documents: [text('Boiler test report', 'बॉयलर चाचणी अहवाल', 'बॉयलर परीक्षण रिपोर्ट')], deemedEligible: false },
  { id: 'groundwater', name: text('Groundwater Extraction NOC', 'भूजल उपसा ना-हरकत प्रमाणपत्र', 'भूजल निष्कर्षण अनापत्ति प्रमाणपत्र'), department: 'CGWA / State Authority', stage: 'Pre-establishment', days: 30, fee: 5000, tags: ['water', 'groundwater'], documents: [text('Hydrogeology report and water audit', 'जलभूवैज्ञानिक अहवाल आणि पाणी लेखापरीक्षण', 'जलभूविज्ञान रिपोर्ट और जल ऑडिट')], deemedEligible: false },
  { id: 'environment', name: text('Environmental Clearance Screening', 'पर्यावरण मंजुरी छाननी', 'पर्यावरणीय स्वीकृति जांच'), department: 'Environment Department', stage: 'Planning', days: 45, fee: 25000, tags: ['large', 'pollution'], documents: [text('Pre-feasibility report', 'पूर्व व्यवहार्यता अहवाल', 'पूर्व व्यवहार्यता रिपोर्ट')], deemedEligible: false },
  { id: 'commencement', name: text('Commencement Certificate', 'काम सुरू प्रमाणपत्र', 'कार्य प्रारंभ प्रमाणपत्र'), department: 'Local Body', stage: 'Pre-establishment', days: 14, fee: 2500, tags: ['building'], documents: [text('Approved building plan', 'मंजूर इमारत आराखडा', 'स्वीकृत भवन मानचित्र')], deemedEligible: false },
];

export const schemes = [
  { id: 'psi', name: text('Package Scheme of Incentives', 'प्रोत्साहन पॅकेज योजना', 'प्रोत्साहन पैकेज योजना'), description: text('Illustrative capital and eligible investment support for qualifying units.', 'पात्र उद्योगांसाठी नमुना भांडवली सहाय्य.', 'पात्र इकाइयों के लिए उदाहरण निवेश सहायता.'), benefit: 'Up to 30% eligible investment', tags: ['manufacturing', 'msme'] },
  { id: 'capital', name: text('MSME Capital Subsidy', 'एमएसएमई भांडवली अनुदान', 'एमएसएमई पूंजी सब्सिडी'), description: text('Illustrative support toward eligible plant and machinery.', 'पात्र यंत्रसामग्रीसाठी नमुना सहाय्य.', 'पात्र मशीनरी के लिए उदाहरण सहायता.'), benefit: 'Up to ₹25 lakh', tags: ['msme', 'manufacturing'] },
  { id: 'power', name: text('Power Tariff Subsidy', 'वीज दर अनुदान', 'बिजली दर सब्सिडी'), description: text('Illustrative tariff support for eligible industrial consumers.', 'पात्र औद्योगिक ग्राहकांसाठी नमुना वीज दर सहाय्य.', 'पात्र औद्योगिक उपभोक्ताओं के लिए उदाहरण सहायता.'), benefit: 'Up to ₹1 per unit', tags: ['manufacturing', 'power'] },
  { id: 'stamp', name: text('Stamp Duty Exemption', 'मुद्रांक शुल्क सवलत', 'स्टाम्प शुल्क छूट'), description: text('Illustrative exemption for eligible investment agreements.', 'पात्र गुंतवणूक करारांसाठी नमुना सवलत.', 'पात्र निवेश समझौतों के लिए उदाहरण छूट.'), benefit: 'Up to 100% exemption', tags: ['manufacturing', 'land'] },
  { id: 'interest', name: text('Interest Subsidy', 'व्याज अनुदान', 'ब्याज सब्सिडी'), description: text('Illustrative interest relief for qualifying micro units.', 'पात्र सूक्ष्म उद्योगांसाठी नमुना व्याज सवलत.', 'पात्र सूक्ष्म इकाइयों के लिए उदाहरण ब्याज राहत.'), benefit: 'Up to 5% interest', tags: ['msme'] },
  { id: 'women', name: text('Women Entrepreneur Support', 'महिला उद्योजक सहाय्य', 'महिला उद्यमी सहायता'), description: text('Illustrative additional support for women-led enterprises.', 'महिला नेतृत्वाखालील उद्योगांसाठी नमुना सहाय्य.', 'महिला नेतृत्व वाले उद्यमों के लिए उदाहरण सहायता.'), benefit: 'Additional eligible benefits', tags: ['women', 'msme'] },
  { id: 'scst', name: text('SC/ST Entrepreneur Support', 'अनुसूचित जाती-जमाती उद्योजक सहाय्य', 'अनुसूचित जाति/जनजाति उद्यमी सहायता'), description: text('Illustrative support for qualifying SC/ST-owned enterprises.', 'पात्र अनुसूचित जाती-जमाती उद्योगांसाठी नमुना सहाय्य.', 'पात्र अनुसूचित जाति/जनजाति उद्यमों के लिए सहायता.'), benefit: 'Up to ₹15 lakh', tags: ['scst', 'msme'] },
  { id: 'export', name: text('Export Promotion Assistance', 'निर्यात प्रोत्साहन सहाय्य', 'निर्यात प्रोत्साहन सहायता'), description: text('Illustrative reimbursement for eligible export readiness costs.', 'पात्र निर्यात तयारी खर्चासाठी नमुना परतावा.', 'पात्र निर्यात तैयारी लागत की उदाहरण प्रतिपूर्ति.'), benefit: 'Up to ₹10 lakh', tags: ['manufacturing', 'export'] },
  { id: 'green', name: text('Green Industry Transition', 'हरित उद्योग संक्रमण', 'हरित उद्योग परिवर्तन'), description: text('Illustrative support for energy and resource efficiency upgrades.', 'ऊर्जा व संसाधन कार्यक्षमतेसाठी नमुना सहाय्य.', 'ऊर्जा और संसाधन दक्षता उन्नयन के लिए उदाहरण सहायता.'), benefit: 'Up to 25% project cost', tags: ['manufacturing', 'green'] },
  { id: 'startup', name: text('Innovation and Startup Assistance', 'नवोपक्रम व स्टार्टअप सहाय्य', 'नवाचार और स्टार्टअप सहायता'), description: text('Illustrative early-stage support for innovative ventures.', 'नवोपक्रमशील उद्योगांसाठी नमुना प्रारंभिक सहाय्य.', 'नवोन्मेषी उद्यमों के लिए उदाहरण प्रारंभिक सहायता.'), benefit: 'Up to ₹10 lakh', tags: ['service', 'startup'] },
];

export const approvalDependencies = [
  { approvalId: 'commencement', dependsOnId: 'building' },
  { approvalId: 'fire', dependsOnId: 'building' },
  { approvalId: 'factory', dependsOnId: 'building' },
  { approvalId: 'occupancy', dependsOnId: 'commencement' },
  { approvalId: 'cto', dependsOnId: 'cte' },
  { approvalId: 'factoryinspection', dependsOnId: 'factory' },
  { approvalId: 'hazardous', dependsOnId: 'cte' },
  { approvalId: 'boilerinspection', dependsOnId: 'boiler' },
];

export const departments = ['MPCB', 'MPCB / CPCB', 'Fire Services', 'DISH', 'Labour', 'MSEDCL', 'Local Body', 'MIDC', 'MIDC / Water Resources', 'Revenue', 'GST', 'Maharashtra GST', 'MSME', 'EPFO / ESIC', 'Boiler Directorate', 'Food Safety', 'CGWA / State Authority', 'Environment Department', 'Water Resources'];
export const knowledgeArticles = [
  { slug: 'consent-to-establish', title: text('MPCB Consent to Establish: preparation guide', 'MPCB स्थापना संमती: तयारी मार्गदर्शक', 'MPCB स्थापना सहमति: तैयारी मार्गदर्शिका'), category: 'Environment', tags: ['mpcb', 'pollution', 'manufacturing'] },
  { slug: 'factory-licence', title: text('Factory plan approval and licence', 'कारखाना आराखडा मंजुरी व परवाना', 'कारखाना मानचित्र स्वीकृति और लाइसेंस'), category: 'Workplace', tags: ['factory', 'workers', 'dish'] },
  { slug: 'fire-noc', title: text('Preparing for a Fire NOC', 'अग्निशमन ना-हरकत प्रमाणपत्राची तयारी', 'अग्निशमन अनापत्ति प्रमाणपत्र की तैयारी'), category: 'Safety', tags: ['fire', 'building'] },
  { slug: 'udyam-registration', title: text('Udyam Registration for MSMEs', 'एमएसएमईसाठी उद्यम नोंदणी', 'एमएसएमई के लिए उद्यम पंजीकरण'), category: 'Business setup', tags: ['msme', 'udyam'] },
  { slug: 'application-readiness', title: text('Make an application submission-ready', 'अर्ज सादरीकरणासाठी तयार करा', 'आवेदन जमा करने योग्य बनाएं'), category: 'Applications', tags: ['documents', 'application'] },
  { slug: 'common-inspection', title: text('How common inspections work', 'संयुक्त तपासणी कशी होते', 'संयुक्त निरीक्षण कैसे काम करता है'), category: 'Inspections', tags: ['inspection', 'officer'] },
  { slug: 'gst-registration', title: text('GST registration for new businesses', 'नवीन व्यवसायांसाठी जीएसटी नोंदणी', 'नए व्यवसायों के लिए जीएसटी पंजीकरण'), category: 'Business setup', tags: ['gst', 'trading'] },
  { slug: 'water-permission', title: text('Industrial water permissions', 'औद्योगिक पाणी परवानग्या', 'औद्योगिक जल अनुमतियां'), category: 'Utilities', tags: ['water', 'midc'] },
  { slug: 'land-permission', title: text('Land use and non-agricultural permission', 'जमीन वापर आणि अकृषिक परवानगी', 'भूमि उपयोग और गैर-कृषि अनुमति'), category: 'Land', tags: ['land', 'revenue'] },
  { slug: 'labour-licences', title: text('Labour registrations at a glance', 'कामगार नोंदणी एका नजरेत', 'श्रम पंजीकरण एक नज़र में'), category: 'Workplace', tags: ['labour', 'workers'] },
  { slug: 'incentives-guide', title: text('Understanding illustrative incentives', 'नमुना प्रोत्साहन समजून घ्या', 'उदाहरण प्रोत्साहन समझें'), category: 'Schemes', tags: ['scheme', 'msme'] },
  { slug: 'renewals', title: text('Plan renewals before they are due', 'नूतनीकरणाची वेळेत योजना करा', 'समय रहते नवीनीकरण की योजना बनाएं'), category: 'Compliance', tags: ['renewal', 'compliance'] },
  { slug: 'inspection-readiness', title: text('Prepare your site for inspection', 'तपासणीसाठी जागा तयार करा', 'निरीक्षण के लिए स्थल तैयार करें'), category: 'Inspections', tags: ['inspection', 'safety'] },
  { slug: 'query-response', title: text('Responding to a department query', 'विभागाच्या प्रश्नाला उत्तर द्या', 'विभागीय प्रश्न का जवाब दें'), category: 'Applications', tags: ['query', 'documents'] },
  { slug: 'grievance-process', title: text('How grievance escalation works', 'तक्रार निवारण कसे होते', 'शिकायत वृद्धि प्रक्रिया कैसे काम करती है'), category: 'Support', tags: ['grievance', 'support'] },
];

export type DemoApplication = { id: string; business: string; district: string; status: string; department: string; submitted: string; dueIn: number; risk: number; ownerEmail: string };
const statuses = ['Under Scrutiny', 'Submitted', 'Query Raised', 'Approved', 'Inspection Scheduled', 'Under Scrutiny', 'Certificate Issued', 'Submitted'];
const businesses = ['Sahyadri Foods', 'Nirman Components', 'Konkan BioTech', 'Pragati Textiles', 'Western Auto Works'];
const applicantEmails = ['applicant@udyogmitra.demo', 'foundry@udyogmitra.demo', 'textiles@udyogmitra.demo'];
export const demoApplications: DemoApplication[] = Array.from({ length: 30 }, (_, index) => ({
  id: `UM-${2026}-${String(2401 + index).padStart(5, '0')}`,
  business: businesses[index % businesses.length],
  district: ['Pune', 'Nashik', 'Nagpur', 'Kolhapur', 'Raigad'][index % 5],
  status: statuses[index % statuses.length],
  department: departments[index % departments.length],
  submitted: new Date(Date.UTC(2026, 8, 28 - (index % 25))).toISOString().slice(0, 10),
  dueIn: [2, 5, 12, -2, 8][index % 5],
  risk: [18, 31, 58, 72, 24][index % 5],
  ownerEmail: applicantEmails[index % applicantEmails.length],
}));
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { approvals, knowledgeArticles, schemes, type LocaleText } from '@/lib/demo-data';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const inputSchema = z.object({ message: z.string().trim().min(1).max(1000), locale: z.enum(['en', 'mr', 'hi']) });
const windows = new Map<string, { startedAt: number; count: number }>();
const intervalMs = 60_000;
const maxRequests = 30;

type Source = { title: string; href: string; content: string; tags: string[] };

function localizedText(value: LocaleText, locale: 'en' | 'mr' | 'hi') {
  return value[locale];
}

function sources(): Source[] {
  return [
    ...knowledgeArticles.map((item) => ({ title: item.title.en, href: `/knowledge/${item.slug}`, content: `${item.title.en} ${item.category} ${item.tags.join(' ')}`, tags: item.tags })),
    ...approvals.map((item) => ({ title: item.name.en, href: '/know-your-approvals', content: `${item.name.en} ${item.department} ${item.stage} ${item.tags.join(' ')} ${item.days} days fee ${item.fee}`, tags: item.tags })),
    ...schemes.map((item) => ({ title: item.name.en, href: '/incentives', content: `${item.name.en} ${item.description.en} ${item.tags.join(' ')}`, tags: item.tags })),
  ];
}

function retrieve(message: string) {
  const words = message.toLowerCase().match(/[a-z0-9]{3,}/g) ?? [];
  const asksTiming = /fee|cost|timeline|how long|days|शुल्क|कालावधी|किती दिवस|फीस|समय|दिन/.test(message.toLowerCase());
  return sources().map((source) => {
    const content = source.content.toLowerCase();
    const matched = words.filter((word) => content.includes(word));
    const tagMatches = source.tags.filter((tag) => message.toLowerCase().includes(tag)).length;
    const timingBoost = asksTiming && source.href === '/know-your-approvals' ? 3 : 0;
    return { source, score: new Set(matched).size + tagMatches * 1.25 + timingBoost };
  }).sort((left, right) => right.score - left.score).slice(0, 3);
}

function fallbackAnswer(message: string, locale: 'en' | 'mr' | 'hi', top: ReturnType<typeof retrieve>[number] | undefined) {
  const query = message.toLowerCase();
  const legalSuffix = locale === 'mr' ? 'हे केवळ मार्गदर्शन आहे; कायदेशीर सल्ला नाही.' : locale === 'hi' ? 'यह केवल मार्गदर्शन है, कानूनी सलाह नहीं।' : 'This is guidance only, not legal advice.';
  if (!top || top.score < 1) {
    const handoff = locale === 'mr' ? 'या प्रश्नासाठी एक खिडकी मदत केंद्राशी संपर्क करा.' : locale === 'hi' ? 'इस प्रश्न के लिए सिंगल-विंडो सहायता केंद्र से संपर्क करें।' : 'Please contact the single-window helpdesk for case-specific guidance.';
    return `${handoff} ${legalSuffix}`;
  }
  const approval = approvals.find((item) => top.source.href === '/know-your-approvals' && item.name.en === top.source.title);
  const asksTiming = /fee|cost|timeline|how long|days|शुल्क|कालावधी|किती दिवस|फीस|समय|दिन/.test(query);
  if (approval && asksTiming) {
    const detail = locale === 'mr'
      ? `${localizedText(approval.name, locale)}: नमुना कालमर्यादा ${approval.days} दिवस आणि नमुना शुल्क ₹${approval.fee.toLocaleString('en-IN')}.`
      : locale === 'hi'
        ? `${localizedText(approval.name, locale)}: उदाहरण समय-सीमा ${approval.days} दिन और उदाहरण शुल्क ₹${approval.fee.toLocaleString('en-IN')}।`
        : `${approval.name.en}: illustrative processing time ${approval.days} days and illustrative fee ₹${approval.fee.toLocaleString('en-IN')}.`;
    return `${detail} ${legalSuffix}`;
  }
  const title = top.source.title;
  const guidance = locale === 'mr' ? `या विषयासाठी संबंधित मार्गदर्शक: ${title}. तुमच्या क्षेत्र व ठिकाणानुसार आवश्यकता बदलू शकतात.` : locale === 'hi' ? `इस विषय की संबंधित मार्गदर्शिका: ${title}। आवश्यकताएं आपके क्षेत्र और स्थान के अनुसार बदल सकती हैं।` : `A relevant guide is “${title}”. Requirements can vary with your sector and location.`;
  return `${guidance} ${legalSuffix}`;
}

export async function POST(request: NextRequest) {
  const key = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  const now = Date.now();
  const window = windows.get(key);
  if (window && now - window.startedAt < intervalMs && window.count >= maxRequests) {
    return NextResponse.json({ error: { code: 'RATE_LIMITED', message: 'Please wait before trying again.' } }, { status: 429 });
  }
  windows.set(key, !window || now - window.startedAt >= intervalMs ? { startedAt: now, count: 1 } : { ...window, count: window.count + 1 });

  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'A message and supported locale are required.' } }, { status: 400 });
  const { message, locale } = parsed.data;
  const applicationId = message.match(/\bUM-\d{4}-\d+\b/i)?.[0].toUpperCase();
  if (applicationId && /status|track|application|अर्ज|स्थिती|स्थिति|आवेदन/.test(message.toLowerCase())) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ answer: locale === 'mr' ? 'अर्जाचा सुरक्षित मागोवा घेण्यासाठी कृपया लॉग इन करा. केवळ मार्गदर्शन; कायदेशीर सल्ला नाही.' : locale === 'hi' ? 'आवेदन को सुरक्षित रूप से ट्रैक करने के लिए लॉग इन करें। केवल मार्गदर्शन, कानूनी सलाह नहीं।' : 'Please sign in to securely track an application. Guidance only, not legal advice.', source: null, handoff: false });
    const application = await prisma.application.findUnique({ where: { id: applicationId }, include: { businessProfile: { select: { userId: true } }, subApplications: { select: { departmentId: true } } } });
    let authorized = session.user.role === 'admin' || session.user.role === 'nodal';
    if (session.user.role === 'applicant') authorized = application?.businessProfile.userId === session.user.id;
    if (session.user.role === 'officer' && application) {
      const officer = await prisma.user.findUnique({ where: { id: session.user.id }, select: { departmentId: true } });
      authorized = application.subApplications.some((item) => item.departmentId === officer?.departmentId);
    }
    if (!application || !authorized) {
      const hidden = locale === 'mr' ? 'या क्रमांकासाठी कोणताही प्रवेशयोग्य अर्ज सापडला नाही. केवळ मार्गदर्शन; कायदेशीर सल्ला नाही.' : locale === 'hi' ? 'इस आईडी के लिए कोई सुलभ आवेदन नहीं मिला। केवल मार्गदर्शन, कानूनी सलाह नहीं।' : 'No accessible application was found for that ID. Guidance only, not legal advice.';
      return NextResponse.json({ answer: hidden, source: null, handoff: true });
    }
    const status = application.status;
    const statusText = locale === 'mr' ? `अर्ज ${application.id} ची स्थिती: ${status}.` : locale === 'hi' ? `आवेदन ${application.id} की स्थिति: ${status}।` : `Application ${application.id} status: ${status}.`;
    const suffix = locale === 'mr' ? 'केवळ मार्गदर्शन; कायदेशीर सल्ला नाही.' : locale === 'hi' ? 'केवल मार्गदर्शन, कानूनी सलाह नहीं।' : 'Guidance only, not legal advice.';
    return NextResponse.json({ answer: `${statusText} ${suffix}`, source: { title: application.id, href: `/applications/${application.id}` }, handoff: false });
  }
  const matches = retrieve(message);
  const top = matches[0];
  let answer = fallbackAnswer(message, locale, top);

  if (process.env.LLM_API_KEY && process.env.LLM_PROVIDER === 'openai' && top?.score) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST', signal: AbortSignal.timeout(12_000),
        headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.LLM_API_KEY}` },
        body: JSON.stringify({ model: 'gpt-4o-mini', temperature: 0.2, messages: [
          { role: 'system', content: `Answer in ${locale}. Use only these illustrative sources and never invent fees or timelines. State that answers are guidance only, not legal advice. If uncertain, direct the user to the human helpdesk. Sources: ${matches.map(({ source }) => source.content).join('\n')}` },
          { role: 'user', content: message },
        ] }),
      });
      if (response.ok) {
        const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
        answer = `${payload.choices?.[0]?.message?.content?.trim() || answer} ${locale === 'mr' ? 'हे केवळ मार्गदर्शन आहे; कायदेशीर सल्ला नाही.' : locale === 'hi' ? 'यह केवल मार्गदर्शन है, कानूनी सलाह नहीं।' : 'Guidance only, not legal advice.'}`;
      }
    } catch {
      // The local knowledge answer remains available when the optional provider is unavailable.
    }
  }

  const source = top && top.score > 0 ? { title: localizedSourceTitle(top.source.title, locale), href: top.source.href } : null;
  return NextResponse.json({ answer, source, handoff: !top || top.score < 1 });
}

function localizedSourceTitle(title: string, locale: 'en' | 'mr' | 'hi') {
  const article = knowledgeArticles.find((item) => item.title.en === title);
  if (article) return article.title[locale];
  const approval = approvals.find((item) => item.name.en === title);
  if (approval) return approval.name[locale];
  const scheme = schemes.find((item) => item.name.en === title);
  return scheme?.name[locale] ?? title;
}
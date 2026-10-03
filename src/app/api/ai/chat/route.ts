import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { grantExternalAiConsent, orchestrate } from '@/services/ai/orchestrator';
import { createAgentToolRegistry } from '@/services/ai/tools';
import { VerificationInputSchema } from '@/services/ai/l3-verify/contracts';

const requestSchema = z.object({
  message: z.string().trim().min(1).max(1000),
  language: z.enum(['en', 'mr', 'hi']).optional(),
  externalProcessingConsent: z.boolean().default(false),
  document: VerificationInputSchema.optional(),
}).strict();
const requestWindows = new Map<string, { start: number; count: number }>();

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const caller = session?.user.id ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anonymous';
  const now = Date.now();
  const window = requestWindows.get(caller);
  if (window && now - window.start < 60_000 && window.count >= 30) {
    return NextResponse.json({ error: { code: 'RATE_LIMITED', message: 'Please wait before trying again.' } }, { status: 429 });
  }
  requestWindows.set(caller, !window || now - window.start >= 60_000 ? { start: now, count: 1 } : { ...window, count: window.count + 1 });

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'A message and supported language are required.' } }, { status: 400 });
  const userId = session?.user.id ?? null;
  if (parsed.data.externalProcessingConsent && userId) grantExternalAiConsent(userId);
  try {
    const roles = ['applicant', 'officer', 'nodal', 'admin'] as const;
    const role = roles.find((candidate) => candidate === session?.user.role) ?? null;
    const readApplicationStatus = async (actorId: string, actorRole: NonNullable<typeof role>, applicationId: string) => {
      const application = await prisma.application.findUnique({ where: { id: applicationId }, include: { businessProfile: { select: { userId: true } }, subApplications: { select: { departmentId: true } } } });
      if (!application) return null;
      if (actorRole === 'applicant' && application.businessProfile.userId !== actorId) return null;
      if (actorRole === 'officer') {
        const officer = await prisma.user.findUnique({ where: { id: actorId }, select: { departmentId: true } });
        if (!application.subApplications.some((item) => item.departmentId === officer?.departmentId)) return null;
      }
      return { status: application.status, source: 'authorized application record' };
    };
    const toolRegistry = createAgentToolRegistry({ readApplicationStatus });
    const result = await orchestrate({ ...parsed.data, userId, role }, toolRegistry);
    return NextResponse.json({ data: result });
  } catch {
    return NextResponse.json({ error: { code: 'AI_UNAVAILABLE', message: 'The assistant could not process that request. Please contact the single-window helpdesk.' } }, { status: 503 });
  }
}
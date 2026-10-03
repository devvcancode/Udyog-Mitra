import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { isSameOrigin } from '@/lib/security';
import { auditSink } from '@/services/governance/audit';
import { consentLedger } from '@/services/governance/consent';
import { grantExternalAiConsent } from '@/services/ai/orchestrator';

const consentActionSchema = z.object({ action: z.enum(['grant', 'revoke']) }).strict();

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Sign in to manage external processing consent.' } }, { status: 401 });
  const record = consentLedger.list(session.user.id).find((item) => item.purpose === 'external_ai' && item.revokedAt === null && Date.parse(item.expiresAt) > Date.now());
  return NextResponse.json({ data: { granted: Boolean(record && consentLedger.hasConsent(session.user.id, 'external_ai', 'process-chat')), expiresAt: record?.expiresAt ?? null } });
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: { code: 'INVALID_ORIGIN', message: 'Cross-origin request denied.' } }, { status: 403 });
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Sign in to manage external processing consent.' } }, { status: 401 });
  const parsed = consentActionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'A consent action is required.' } }, { status: 400 });

  if (parsed.data.action === 'grant') {
    const record = grantExternalAiConsent(session.user.id);
    auditSink.append({ actorId: session.user.id, action: 'consent.external_ai.grant', layer: 'governance', model: null, reasonTrace: ['governance.purpose_bound_consent'], input: { purpose: 'external_ai', scope: ['process-chat'] } });
    return NextResponse.json({ data: { granted: Boolean(record), expiresAt: record?.expiresAt ?? null } });
  }
  const record = consentLedger.list(session.user.id).find((item) => item.purpose === 'external_ai' && item.revokedAt === null);
  const revoked = record ? consentLedger.revoke(record.id, session.user.id) : false;
  auditSink.append({ actorId: session.user.id, action: 'consent.external_ai.revoke', layer: 'governance', model: null, reasonTrace: ['governance.consent_revocation'], input: { purpose: 'external_ai', revoked } });
  return NextResponse.json({ data: { granted: false, revoked } });
}
import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { auditSink } from '@/services/governance/audit';
import { parseWhatsAppInbound, verifyMetaWebhookSignature } from '@/services/connectors/whatsapp';

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('hub.mode');
  const token = request.nextUrl.searchParams.get('hub.verify_token') ?? '';
  const challenge = request.nextUrl.searchParams.get('hub.challenge') ?? '';
  const expected = process.env.WHATSAPP_VERIFY_TOKEN ?? '';
  const actualBytes = Buffer.from(token);
  const expectedBytes = Buffer.from(expected);
  const tokenMatches = Boolean(expected && actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes));
  if (mode === 'subscribe' && tokenMatches) return new Response(challenge, { status: 200, headers: { 'content-type': 'text/plain' } });
  return NextResponse.json({ error: { code: 'WEBHOOK_VERIFICATION_FAILED', message: 'Webhook verification failed.' } }, { status: 403 });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-hub-signature-256');
  const configured = Boolean(process.env.WHATSAPP_APP_SECRET);
  const mockSignature = request.headers.get('x-udyog-mitra-demo-signature');
  const expectedMock = process.env.NODE_ENV !== 'production' ? createHmac('sha256', 'local-demo-only').update(rawBody).digest('hex') : '';
  const isMock = Boolean(expectedMock && mockSignature && Buffer.from(expectedMock).length === Buffer.from(mockSignature).length && timingSafeEqual(Buffer.from(expectedMock), Buffer.from(mockSignature)));
  if (!(configured ? verifyMetaWebhookSignature(rawBody, signature) : isMock)) {
    return NextResponse.json({ error: { code: 'INVALID_SIGNATURE', message: 'Webhook signature could not be verified.' } }, { status: configured ? 401 : 503 });
  }
  let payload: unknown;
  try { payload = JSON.parse(rawBody); } catch { return NextResponse.json({ error: { code: 'INVALID_JSON', message: 'Invalid webhook payload.' } }, { status: 400 }); }
  const inbound = parseWhatsAppInbound(payload);
  auditSink.append({ actorId: null, action: 'whatsapp.webhook.received', layer: 'connector', model: null, reasonTrace: ['connector.whatsapp.signature_valid', 'governance.raw_payload_not_retained'], input: { messageCount: inbound.length, messageTypes: inbound.map((message) => message.type) } });
  return NextResponse.json({ data: { accepted: true, messageCount: inbound.length, rawContentRetained: false } });
}
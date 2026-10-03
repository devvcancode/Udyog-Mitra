import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { maskPii } from '../governance/pii-mask';

export const WhatsAppTextSchema = z.object({ to: z.string().regex(/^\+[1-9]\d{7,14}$/), text: z.string().trim().min(1).max(4096) }).strict();
export const WhatsAppWebhookEnvelopeSchema = z.object({
  entry: z.array(z.object({ changes: z.array(z.object({ value: z.object({ messages: z.array(z.object({ from: z.string(), type: z.string(), text: z.object({ body: z.string() }).optional() }).passthrough()).optional() }).passthrough() }).passthrough()) }).passthrough()),
}).passthrough();

export type WhatsAppSetupStatus = { mode: 'cloud_api' | 'mock'; ready: boolean; missing: string[]; helpNumberConfigured: boolean };

export function getWhatsAppSetupStatus(): WhatsAppSetupStatus {
  const required = ['WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_VERIFY_TOKEN', 'WHATSAPP_APP_SECRET'] as const;
  const missing = required.filter((key) => !process.env[key]);
  return { mode: missing.length === 0 ? 'cloud_api' : 'mock', ready: missing.length === 0, missing, helpNumberConfigured: Boolean(process.env.NEXT_PUBLIC_WHATSAPP_HELP_NUMBER) };
}

export function verifyMetaWebhookSignature(rawBody: string, signature: string | null, appSecret = process.env.WHATSAPP_APP_SECRET): boolean {
  if (!signature || !appSecret || !signature.startsWith('sha256=')) return false;
  const expected = Buffer.from(`sha256=${createHmac('sha256', appSecret).update(rawBody).digest('hex')}`);
  const received = Buffer.from(signature);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export function parseWhatsAppInbound(payload: unknown) {
  const parsed = WhatsAppWebhookEnvelopeSchema.safeParse(payload);
  if (!parsed.success) return [];
  return parsed.data.entry.flatMap((entry) => entry.changes.flatMap((change) => (change.value.messages ?? []).map((message) => ({
    from: maskPii(message.from).text,
    text: message.type === 'text' ? maskPii(message.text?.body?.slice(0, 1000) ?? '').text : '',
    type: message.type,
  }))));
}

export class WhatsAppGateway {
  async sendText(rawInput: z.input<typeof WhatsAppTextSchema>): Promise<{ mode: 'cloud_api' | 'mock'; accepted: boolean; messageId: string | null }> {
    const input = WhatsAppTextSchema.parse(rawInput);
    const status = getWhatsAppSetupStatus();
    if (!status.ready) return { mode: 'mock', accepted: false, messageId: null };
    const version = process.env.WHATSAPP_API_VERSION || 'v23.0';
    const response = await fetch(`https://graph.facebook.com/${version}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST', signal: AbortSignal.timeout(10_000),
      headers: { authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`, 'content-type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to: input.to.replace(/^\+/, ''), type: 'text', text: { body: input.text } }),
    });
    if (!response.ok) return { mode: 'cloud_api', accepted: false, messageId: null };
    const payload = await response.json() as { messages?: Array<{ id?: string }> };
    return { mode: 'cloud_api', accepted: true, messageId: payload.messages?.[0]?.id ?? null };
  }
}

export const whatsappGateway = new WhatsAppGateway();

export function buildWhatsAppHelpLink(text: string): string | null {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_HELP_NUMBER?.replace(/\D/g, '');
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
import { NextResponse } from 'next/server';
import { getWhatsAppSetupStatus } from '@/services/connectors/whatsapp';

export async function GET() {
  const status = getWhatsAppSetupStatus();
  return NextResponse.json({ data: { mode: status.mode, ready: status.ready, missing: status.missing, helpNumberConfigured: status.helpNumberConfigured } });
}
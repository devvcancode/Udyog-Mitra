import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOrigin } from '@/lib/security';
import { estimateJourney, TimelineInputSchema } from '@/services/ai/l2-rulecore/timeline-engine';

const windows = new Map<string, { start: number; count: number }>();

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: { code: 'INVALID_ORIGIN', message: 'Cross-origin request denied.' } }, { status: 403 });
  const key = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  const now = Date.now();
  const window = windows.get(key);
  if (window && now - window.start < 60_000 && window.count >= 20) return NextResponse.json({ error: { code: 'RATE_LIMITED', message: 'Please wait before estimating again.' } }, { status: 429 });
  windows.set(key, !window || now - window.start >= 60_000 ? { start: now, count: 1 } : { ...window, count: window.count + 1 });
  const parsed = TimelineInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'Provide a project profile and at least one known approval.', issues: parsed.error.issues } }, { status: 400 });
  try { return NextResponse.json({ data: estimateJourney(parsed.data) }); }
  catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'Timeline input did not match the expected schema.' } }, { status: 400 });
    return NextResponse.json({ error: { code: 'TIMELINE_UNAVAILABLE', message: 'The timeline could not be calculated.' } }, { status: 422 });
  }
}
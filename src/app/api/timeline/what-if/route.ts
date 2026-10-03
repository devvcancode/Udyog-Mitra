import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOrigin } from '@/lib/security';
import { estimateWhatIf, TimelineInputSchema } from '@/services/ai/l2-rulecore/timeline-engine';

const changeSchema = z.object({
  approvalIds: z.array(z.string()).optional(),
  documents: z.array(z.object({ docType: z.string(), status: z.enum(['have/verified', 'have/unverified', 'missing']), source: z.enum(['DigiLocker', 'manual', 'connector', 'none']) }).strict()).optional(),
  profile: z.object({ activity: z.enum(['manufacturing', 'service', 'trading']).optional(), sector: z.string().optional(), investmentLakhs: z.number().nonnegative().optional(), employees: z.number().int().nonnegative().optional(), powerKw: z.number().nonnegative().optional(), waterKld: z.number().nonnegative().optional(), hazardous: z.boolean().optional(), stage: z.string().optional(), landType: z.string().optional() }).strict().optional(),
  fastTrack: z.boolean().optional(),
}).strict();
const requestSchema = z.object({ base: TimelineInputSchema, change: changeSchema }).strict();

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: { code: 'INVALID_ORIGIN', message: 'Cross-origin request denied.' } }, { status: 403 });
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'The what-if scenario is invalid.', issues: parsed.error.issues } }, { status: 400 });
  return NextResponse.json({ data: estimateWhatIf(parsed.data.base, parsed.data.change) });
}
import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { isSameOrigin } from '@/lib/security';

const registrationSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  mobile: z.string().regex(/^[6-9][0-9]{9}$/),
  otp: z.literal('123456'),
  password: z.string().min(8).max(72),
});

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: { code: 'INVALID_ORIGIN', message: 'Cross-origin request denied.' } }, { status: 403 });
  const parsed = registrationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'Review the registration fields and demo OTP.' } }, { status: 400 });
  const applicantRole = await prisma.role.findUnique({ where: { name: 'Applicant' } });
  if (!applicantRole) return NextResponse.json({ error: { code: 'SETUP_REQUIRED', message: 'Demo roles have not been seeded.' } }, { status: 503 });
  const { name, email, mobile, password } = parsed.data;
  try {
    const user = await prisma.user.create({ data: {
      name, email: email.toLowerCase(), mobile, passwordHash: await hash(password, 10), roles: { connect: { id: applicantRole.id } },
      businessProfile: { create: { legalName: name, activity: 'manufacturing' } },
    }, select: { id: true, email: true, name: true } });
    return NextResponse.json({ data: user }, { status: 201 });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: { code: 'ACCOUNT_EXISTS', message: 'An account already uses that email or mobile.' } }, { status: 409 });
    }
    throw error;
  }
}
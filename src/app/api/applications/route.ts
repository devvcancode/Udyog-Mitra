import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isSameOrigin } from '@/lib/security';

const createSchema = z.object({ projectName: z.string().trim().min(2).max(120), projectStage: z.string(), approvalIds: z.array(z.string()).min(1).max(30) });

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Sign in required.' } }, { status: 401 });
  const where = session.user.role === 'applicant'
    ? { businessProfile: { userId: session.user.id } }
    : session.user.role === 'officer'
      ? {
          subApplications: {
            some: {
              department: {
                users: { some: { id: session.user.id } },
              },
            },
          },
        }
      : {};
  const scopedReviews = session.user.role === 'officer' ? { department: { users: { some: { id: session.user.id } } } } : {};
  const applications = await prisma.application.findMany({ where, include: {
    subApplications: { where: scopedReviews, include: { approval: true, department: true } },
    businessProfile: { select: { legalName: true, activity: true, investmentLakhs: true, employeeCount: true } },
  }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ data: applications });
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: { code: 'INVALID_ORIGIN', message: 'Cross-origin request denied.' } }, { status: 403 });
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'applicant') return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Applicant role required.' } }, { status: session?.user ? 403 : 401 });
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'Project name, stage, and approvals are required.', issues: parsed.error.issues } }, { status: 400 });
  const profile = await prisma.businessProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) return NextResponse.json({ error: { code: 'PROFILE_REQUIRED', message: 'Complete the business profile first.' } }, { status: 409 });
  const requestedApprovals = await prisma.approval.findMany({ where: { id: { in: parsed.data.approvalIds } } });
  if (requestedApprovals.length !== new Set(parsed.data.approvalIds).size) return NextResponse.json({ error: { code: 'UNKNOWN_APPROVAL', message: 'One or more approvals were not found.' } }, { status: 400 });
  const id = `UM-2026-${Date.now().toString().slice(-8)}`;
  const application = await prisma.application.create({ data: {
    id, businessProfileId: profile.id, projectName: parsed.data.projectName, projectStage: parsed.data.projectStage, status: 'Submitted', submittedAt: new Date(),
    subApplications: { create: requestedApprovals.map((approval) => ({ approvalId: approval.id, departmentId: approval.departmentId, status: 'Submitted', dueAt: new Date(Date.now() + approval.slaDays * 86_400_000) })) },
    statusHistory: { create: { actorId: session.user.id, status: 'Submitted', note: 'Common application submitted.' } },
  } });
  await prisma.auditLog.create({ data: { actorId: session.user.id, action: 'APPLICATION_SUBMITTED', entity: 'Application', entityId: id, details: { approvalCount: requestedApprovals.length } } });
  return NextResponse.json({ data: application }, { status: 201 });
}
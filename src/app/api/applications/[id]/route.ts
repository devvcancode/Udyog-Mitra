import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isSameOrigin } from '@/lib/security';

const actionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('approve') }),
  z.object({ action: z.literal('reject'), reason: z.string().trim().min(5).max(1000) }),
  z.object({ action: z.literal('query'), deficiencies: z.array(z.string().trim().min(1)).min(1).max(20) }),
]);

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Sign in required.' } }, { status: 401 });
  const { id } = await params;
  const application = await prisma.application.findFirst({
    where: { id, ...(session.user.role === 'applicant' ? { businessProfile: { userId: session.user.id } } : {}) },
    include: {
      businessProfile: { select: { legalName: true, activity: true, investmentLakhs: true, employeeCount: true, location: { select: { district: true, taluka: true, industrialArea: true } } } },
      subApplications: { include: { approval: true, department: true } },
      statusHistory: { orderBy: { createdAt: 'asc' } }, queries: true,
    },
  });
  if (!application) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Application not found.' } }, { status: 404 });
  let visibleApplication = application;
  if (session.user.role === 'officer') {
    const departmentId = await awaitDepartment(session.user.id);
    if (!application.subApplications.some((item) => item.departmentId === departmentId)) return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'This department does not own the application.' } }, { status: 403 });
    const visibleSubApplications = application.subApplications.filter((item) => item.departmentId === departmentId);
    const visibleSubApplicationIds = new Set(visibleSubApplications.map((item) => item.id));
    visibleApplication = {
      ...application,
      subApplications: visibleSubApplications,
      statusHistory: application.statusHistory.filter((item) => item.subApplicationId !== null && visibleSubApplicationIds.has(item.subApplicationId)),
      queries: application.queries.filter((item) => item.subApplicationId !== null && visibleSubApplicationIds.has(item.subApplicationId)),
    };
  }
  return NextResponse.json({ data: visibleApplication });
}

async function awaitDepartment(userId: string) {
  return (await prisma.user.findUnique({ where: { id: userId }, select: { departmentId: true } }))?.departmentId;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: { code: 'INVALID_ORIGIN', message: 'Cross-origin request denied.' } }, { status: 403 });
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Sign in required.' } }, { status: 401 });
  if (!['officer', 'nodal', 'admin'].includes(session.user.role)) return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Officer role required.' } }, { status: 403 });
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'The action is invalid.', issues: parsed.error.issues } }, { status: 400 });
  const { id } = await params;
  const application = await prisma.application.findUnique({ where: { id }, include: { subApplications: true } });
  if (!application) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Application not found.' } }, { status: 404 });
  const officer = session.user.role === 'officer' ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { departmentId: true } }) : null;
  const owned = officer ? application.subApplications.filter((item) => item.departmentId === officer.departmentId) : application.subApplications;
  if (!owned.length) return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'No assigned departmental application.' } }, { status: 403 });
  const status = parsed.data.action === 'approve' ? 'Approved' : parsed.data.action === 'reject' ? 'Rejected' : 'Query Raised';
  const remainingStatuses = application.subApplications.map((item) => owned.some((ownedItem) => ownedItem.id === item.id) ? status : item.status);
  const applicationStatus = status === 'Rejected' || status === 'Query Raised'
    ? status
    : remainingStatuses.length > 0 && remainingStatuses.every((itemStatus) => itemStatus === 'Approved')
      ? 'Approved'
      : 'Under Scrutiny';
  await prisma.$transaction(async (tx) => {
    await tx.subApplication.updateMany({ where: { id: { in: owned.map((item) => item.id) } }, data: { status } });
    await tx.application.update({ where: { id }, data: { status: applicationStatus } });
    if (parsed.data.action === 'query') {
      await tx.query.create({ data: { applicationId: id, subApplicationId: owned[0].id, officerId: session.user.id, title: 'Department query', deficiencies: parsed.data.deficiencies } });
    }
    await tx.applicationStatusHistory.create({ data: { applicationId: id, subApplicationId: owned[0].id, actorId: session.user.id, status: applicationStatus, note: parsed.data.action === 'reject' ? parsed.data.reason : parsed.data.action === 'query' ? parsed.data.deficiencies.join('; ') : 'Department approval recorded.' } });
    await tx.auditLog.create({ data: { actorId: session.user.id, action: `APPLICATION_${status.toUpperCase().replaceAll(' ', '_')}`, entity: 'Application', entityId: id, details: { departmentAction: true } } });
  });
  return NextResponse.json({ data: { id, status: applicationStatus, departmentStatus: status } });
}
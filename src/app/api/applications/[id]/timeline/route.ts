import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { estimateJourney } from '@/services/ai/l2-rulecore/timeline-engine';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Sign in required.' } }, { status: 401 });
  const { id } = await params;
  const application = await prisma.application.findFirst({
    where: { id, ...(session.user.role === 'applicant' ? { businessProfile: { userId: session.user.id } } : {}) },
    include: {
      businessProfile: { include: { sector: true, location: true } },
      subApplications: { include: { slaClock: true, queries: { where: { status: 'Open' }, select: { id: true } } } },
      documents: { select: { type: true, status: true, ownerId: true } },
    },
  });
  if (!application) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Application not found.' } }, { status: 404 });
  if (session.user.role === 'officer') {
    const officer = await prisma.user.findUnique({ where: { id: session.user.id }, select: { departmentId: true } });
    if (!application.subApplications.some((item) => item.departmentId === officer?.departmentId)) return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'This department does not own the application.' } }, { status: 403 });
  }
  const profile = application.businessProfile;
  const activity = ['manufacturing', 'service', 'trading'].includes(profile.activity) ? profile.activity as 'manufacturing' | 'service' | 'trading' : 'manufacturing';
  const approvalsForTimeline = application.subApplications.map((item) => item.approvalId);
  if (!approvalsForTimeline.length) return NextResponse.json({ error: { code: 'TIMELINE_NOT_READY', message: 'This application has no departmental approval plan yet.' } }, { status: 409 });
  const pausedDays = Object.fromEntries(application.subApplications.map((item) => [item.approvalId, item.slaClock?.pausedDays ?? 0]));
  const documents = application.documents.map((document) => ({
    docType: document.type,
    status: ['verified', 'VERIFIED'].includes(document.status) ? 'have/verified' as const : 'have/unverified' as const,
    source: 'manual' as const,
  }));
  const data = estimateJourney({
    approvalIds: approvalsForTimeline,
    profile: {
      activity, sector: profile.sector?.pollutionCategory ?? 'Green', investmentLakhs: profile.investmentLakhs,
      employees: profile.employeeCount, powerKw: 0, waterKld: 0, hazardous: false, stage: application.projectStage,
      landType: profile.location?.areaType ?? 'MIDC',
    },
    documents, startDate: (application.submittedAt ?? application.createdAt).toISOString(), queryPauseDays: pausedDays,
  });
  return NextResponse.json({ data: { applicationId: application.id, status: application.status, timeline: data } });
}
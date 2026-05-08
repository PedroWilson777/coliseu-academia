import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const [
    totalLeadsToday,
    closingLeads,
    waitingHuman,
    pendingNotifs,
    activeConvs,
    experimentsToday,
    totalStudents,
  ] = await Promise.all([
    prisma.lead.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
    prisma.lead.count({ where: { stage: 'CLOSING' } }),
    prisma.conversation.count({ where: { status: 'WAITING_HUMAN' } }),
    prisma.supervisorNotification.count({ where: { resolvedAt: null } }),
    prisma.conversation.count({ where: { status: { in: ['AI_ACTIVE', 'HUMAN_ACTIVE', 'WAITING_HUMAN'] } } }),
    prisma.appointment.count({
      where: {
        scheduledAt: { gte: today, lt: tomorrow },
        type: 'EXPERIMENTAL',
      },
    }),
    prisma.student.count(),
  ]);

  return NextResponse.json({
    totalLeadsToday,
    closingLeads,
    waitingHuman,
    pendingNotifs,
    activeConvs,
    experimentsToday,
    totalStudents,
  });
}

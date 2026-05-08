import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const future = new Date(today);
  future.setDate(today.getDate() + 30);

  // Professor só vê os próprios agendamentos
  const where: { scheduledAt: { gte: Date; lt: Date }; teacherId?: string } = {
    scheduledAt: { gte: today, lt: future },
  };
  if (user.role === 'TEACHER' && user.teacherId) {
    where.teacherId = user.teacherId;
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      teacher: { select: { name: true } },
      lead: { select: { name: true, phone: true } },
      student: { select: { name: true, phone: true } },
    },
    orderBy: { scheduledAt: 'asc' },
  });

  return NextResponse.json(appointments);
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const notifications = await prisma.supervisorNotification.findMany({
    where: { resolvedAt: null },
    include: {
      conversation: { include: { lead: true, student: true } },
    },
    // HIGH < MEDIUM < LOW em importância (asc por createdAt como desempate)
    orderBy: [{ read: 'asc' }, { createdAt: 'desc' }],
    take: 50,
  });

  return NextResponse.json(notifications);
}

export async function PATCH(req: NextRequest) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await prisma.supervisorNotification.update({
    where: { id },
    data: { resolvedAt: new Date(), read: true },
  });

  return NextResponse.json({ ok: true });
}

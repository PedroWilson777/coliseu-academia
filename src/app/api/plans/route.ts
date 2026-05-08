import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const plans = await prisma.plan.findMany({
    where: { active: true },
    orderBy: [{ modality: 'asc' }, { name: 'asc' }, { priceInCents: 'asc' }],
  });

  return NextResponse.json(plans);
}

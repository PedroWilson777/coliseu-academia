import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const updated = await prisma.conversation.update({
    where: { id: params.id },
    data: {
      status: 'HUMAN_ACTIVE',
      assignedHuman: user.name || user.email,
    },
  });

  return NextResponse.json({ ok: true, status: updated.status });
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const stage = searchParams.get('stage');

  const where: { stage?: 'NEW' | 'QUALIFIED' | 'EXPERIMENTAL' | 'CLOSING' | 'WON' | 'LOST' } = {};
  if (stage && ['NEW', 'QUALIFIED', 'EXPERIMENTAL', 'CLOSING', 'WON', 'LOST'].includes(stage)) {
    where.stage = stage as 'NEW' | 'QUALIFIED' | 'EXPERIMENTAL' | 'CLOSING' | 'WON' | 'LOST';
  }

  const leads = await prisma.lead.findMany({
    where,
    include: {
      conversations: {
        orderBy: { lastMessageAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json(leads);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('❌ API Error:', msg);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id, qualification, stage, notes } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const data: { qualification?: 'HOT' | 'WARM' | 'COLD' | 'UNKNOWN'; stage?: 'NEW' | 'QUALIFIED' | 'EXPERIMENTAL' | 'CLOSING' | 'WON' | 'LOST'; notes?: string } = {};
  if (qualification) data.qualification = qualification;
  if (stage) data.stage = stage;
  if (notes !== undefined) data.notes = notes;

  const updated = await prisma.lead.update({
    where: { id },
    data,
  });

  return NextResponse.json(updated);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('❌ API Error:', msg);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

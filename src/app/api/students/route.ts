import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const students = await prisma.student.findMany({
    include: { plan: true },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(students);
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { name, phone, modality, planId, paymentDay, email } = await req.json();

  if (!name || !phone || !modality) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 });
  }

  const cleanPhone = phone.replace(/\D/g, '');

  const student = await prisma.student.create({
    data: {
      name,
      phone: cleanPhone,
      email,
      modality,
      planId: planId || null,
      paymentDay: paymentDay ? Number(paymentDay) : null,
      status: 'active',
    },
  });

  return NextResponse.json(student);
}

export async function PATCH(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id, ...data } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  if (data.phone) data.phone = data.phone.replace(/\D/g, '');
  if (data.paymentDay) data.paymentDay = Number(data.paymentDay);

  const student = await prisma.student.update({
    where: { id },
    data,
  });

  return NextResponse.json(student);
}

export async function DELETE(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await prisma.student.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

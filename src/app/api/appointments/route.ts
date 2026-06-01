import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get('date');
  const teacherId = searchParams.get('teacherId');
  const days = parseInt(searchParams.get('days') || '30', 10);

  let start: Date;
  let end: Date;

  if (dateStr) {
    start = new Date(`${dateStr}T00:00:00`);
    end = new Date(`${dateStr}T23:59:59`);
  } else {
    start = new Date();
    start.setHours(0, 0, 0, 0);
    end = new Date(start);
    end.setDate(start.getDate() + days);
  }

  const where: Record<string, unknown> = { scheduledAt: { gte: start, lte: end } };

  if (user.role === 'TEACHER' && user.teacherId) {
    where.teacherId = user.teacherId;
  } else if (teacherId) {
    where.teacherId = teacherId;
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      teacher: { select: { id: true, name: true } },
      lead: { select: { name: true, phone: true } },
      student: { select: { name: true, phone: true } },
    },
    orderBy: { scheduledAt: 'asc' },
  });

  return NextResponse.json(appointments);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('❌ API Error:', msg);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { teacherId, modality, scheduledAt, type, notes, leadId, studentId, clientName, clientPhone } = await req.json();

  if (!teacherId || !modality || !scheduledAt) {
    return NextResponse.json({ error: 'teacherId, modality e scheduledAt são obrigatórios' }, { status: 400 });
  }

  let finalLeadId = leadId || null;
  let finalStudentId = studentId || null;

  if (!finalLeadId && !finalStudentId && clientPhone) {
    const cleanPhone = clientPhone.replace(/\D/g, '');
    const student = await prisma.student.findUnique({ where: { phone: cleanPhone } });
    if (student) {
      finalStudentId = student.id;
    } else {
      const lead = await prisma.lead.upsert({
        where: { phone: cleanPhone },
        update: { name: clientName || undefined },
        create: { phone: cleanPhone, name: clientName || null },
      });
      finalLeadId = lead.id;
    }
  }

  const appointment = await prisma.appointment.create({
    data: {
      teacherId,
      modality,
      scheduledAt: new Date(scheduledAt),
      type: type || 'EXPERIMENTAL',
      status: 'SCHEDULED',
      notes: notes || null,
      leadId: finalLeadId,
      studentId: finalStudentId,
    },
    include: {
      teacher: { select: { id: true, name: true } },
      lead: { select: { name: true, phone: true } },
      student: { select: { name: true, phone: true } },
    },
  });

  return NextResponse.json(appointment);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('❌ API Error:', msg);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 });

  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment) return NextResponse.json({ error: 'não encontrado' }, { status: 404 });

  if (user.role === 'TEACHER' && user.teacherId && appointment.teacherId !== user.teacherId) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  await prisma.appointment.update({ where: { id }, data: { status: 'CANCELLED' } });
  return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('❌ API Error:', msg);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

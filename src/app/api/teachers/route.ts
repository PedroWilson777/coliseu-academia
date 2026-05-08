import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const teachers = await prisma.teacher.findMany({
    include: {
      user: { select: { email: true, image: true } },
      _count: { select: { appointments: true } },
    },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(teachers);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { name, email, modalities, hourlyRate, isOwner } = await req.json();

  if (!name || !email || !modalities || modalities.length === 0) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 });
  }

  const cleanEmail = email.toLowerCase().trim();

  // 1. Cria/atualiza User no Prisma (com role TEACHER)
  const dbUser = await prisma.user.upsert({
    where: { email: cleanEmail },
    update: { role: 'TEACHER', name },
    create: {
      email: cleanEmail,
      name,
      role: 'TEACHER',
    },
  });

  // 2. Cria registro de Teacher
  const teacher = await prisma.teacher.create({
    data: {
      userId: dbUser.id,
      name,
      modalities,
      hourlyRate: Math.round(Number(hourlyRate || 0) * 100),
      isOwner: !!isOwner,
    },
  });

  // 3. Tenta enviar Magic Link de convite via Supabase Admin
  // Se falhar, não bloqueia (admin pode pedir pro professor entrar manualmente depois)
  try {
    const supabase = createAdminClient();
    const appUrl = process.env.APP_URL || '';

    await supabase.auth.admin.inviteUserByEmail(cleanEmail, {
      redirectTo: `${appUrl}/auth/callback`,
      data: { name, role: 'TEACHER' },
    });

    console.log(`✉️  Convite enviado pra ${cleanEmail}`);
  } catch (error) {
    console.error('⚠️  Falhou enviar convite (não bloqueia):', error);
  }

  return NextResponse.json({ ok: true, teacher });
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id, name, modalities, hourlyRate, isOwner, active } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const data: { name?: string; modalities?: ('PILATES' | 'MUSCULACAO' | 'CROSSTRAINING')[]; hourlyRate?: number; isOwner?: boolean; active?: boolean } = {};
  if (name) data.name = name;
  if (modalities) data.modalities = modalities;
  if (hourlyRate !== undefined) data.hourlyRate = Math.round(Number(hourlyRate) * 100);
  if (isOwner !== undefined) data.isOwner = isOwner;
  if (active !== undefined) data.active = active;

  const teacher = await prisma.teacher.update({
    where: { id },
    data,
  });

  return NextResponse.json(teacher);
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await prisma.teacher.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

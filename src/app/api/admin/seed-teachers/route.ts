// Endpoint ONE-TIME para cadastrar os professores reais da Coliseu Academia
// ⚠️ Desabilitado em produção (SEED_ENABLED=true para reativar)
// Emails: jordancoliseu@closefit.com | Senha padrão: coliseu2026

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';

const SEED_ENABLED = process.env.SEED_ENABLED === 'true';
const TEACHER_PASSWORD = 'coliseu2026';

export const dynamic = 'force-dynamic';

const TEACHERS_DATA = [
  {
    name: 'Professor Jordan',
    email: 'jordancoliseu@closefit.com',
    phone: '5573998111360',
    modalities: ['PILATES', 'CROSSTRAINING'] as ('PILATES' | 'MUSCULACAO' | 'CROSSTRAINING')[],
    isOwner: false,
    hourlyRate: 0,
  },
  {
    name: 'Professora Letícia',
    email: 'leticiacoliseu@closefit.com',
    phone: '5573981229881',
    modalities: ['PILATES'] as ('PILATES' | 'MUSCULACAO' | 'CROSSTRAINING')[],
    isOwner: false,
    hourlyRate: 0,
  },
  {
    name: 'Professora Laís',
    email: 'laiscoliseu@closefit.com',
    phone: '5533980009361',
    modalities: ['PILATES'] as ('PILATES' | 'MUSCULACAO' | 'CROSSTRAINING')[],
    isOwner: false,
    hourlyRate: 0,
  },
  {
    name: 'Professor Lucas',
    email: 'lucascoliseu@closefit.com',
    phone: '5573982200087',
    modalities: ['MUSCULACAO', 'CROSSTRAINING'] as ('PILATES' | 'MUSCULACAO' | 'CROSSTRAINING')[],
    isOwner: false,
    hourlyRate: 0,
  },
  {
    name: 'Professor Tauan',
    email: 'tauancoliseu@closefit.com',
    phone: '5573999511132',
    modalities: ['CROSSTRAINING'] as ('PILATES' | 'MUSCULACAO' | 'CROSSTRAINING')[],
    isOwner: true, // dono / pró-labore
    hourlyRate: 0,
  },
  {
    name: 'Fisio Brunessa',
    email: 'brunessacoliseu@closefit.com',
    phone: '5573995629690',
    modalities: ['PILATES'] as ('PILATES' | 'MUSCULACAO' | 'CROSSTRAINING')[],
    isOwner: false,
    hourlyRate: 0,
  },
  {
    name: 'Fisio Carolina',
    email: 'carolinacoliseu@closefit.com',
    phone: '5573995629691',
    modalities: ['PILATES'] as ('PILATES' | 'MUSCULACAO' | 'CROSSTRAINING')[],
    isOwner: false,
    hourlyRate: 0,
  },
];

export async function POST() {
  if (!SEED_ENABLED) {
    return NextResponse.json({ error: 'Seed desabilitado em produção. Defina SEED_ENABLED=true para reativar.' }, { status: 403 });
  }
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const supabase = createAdminClient();
  const results: { name: string; status: string }[] = [];

  for (const t of TEACHERS_DATA) {
    try {
      // 1. Cria ou atualiza o User no Prisma
      const dbUser = await prisma.user.upsert({
        where: { email: t.email },
        update: { role: 'TEACHER', name: t.name },
        create: { email: t.email, name: t.name, role: 'TEACHER' },
      });

      // 2. Cria/atualiza usuário no Supabase Auth com senha fixa (sem enviar email)
      const { error: createError } = await supabase.auth.admin.createUser({
        email: t.email,
        password: TEACHER_PASSWORD,
        email_confirm: true,
        user_metadata: { name: t.name, role: 'TEACHER' },
      });

      if (createError && createError.message.includes('already been registered')) {
        const { data: listData } = await supabase.auth.admin.listUsers();
        const existing = listData?.users?.find(u => u.email === t.email);
        if (existing) {
          await supabase.auth.admin.updateUserById(existing.id, { password: TEACHER_PASSWORD });
        }
      }

      // 3. Verifica se já existe um Teacher para este User
      const existingTeacher = await prisma.teacher.findUnique({ where: { userId: dbUser.id } });
      if (existingTeacher) {
        results.push({ name: t.name, status: 'já existe — senha atualizada' });
        continue;
      }

      await prisma.teacher.create({
        data: {
          userId: dbUser.id,
          name: t.name,
          modalities: t.modalities,
          hourlyRate: t.hourlyRate,
          isOwner: t.isOwner,
          active: true,
        },
      });

      results.push({ name: t.name, status: 'criado' });
    } catch (err) {
      results.push({ name: t.name, status: `erro: ${err instanceof Error ? err.message : 'desconhecido'}` });
    }
  }

  return NextResponse.json({ ok: true, results });
}

// GET: mostra o que seria criado (dry run)
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  return NextResponse.json({
    message: 'Faça POST para cadastrar os professores',
    teachers: TEACHERS_DATA.map(t => ({ name: t.name, email: t.email, modalities: t.modalities })),
  });
}

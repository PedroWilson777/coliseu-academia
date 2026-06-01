// Endpoint ONE-TIME para cadastrar os professores reais da Coliseu Academia
// ⚠️ Desabilitado em produção (SEED_ENABLED=true para reativar)

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

const SEED_ENABLED = process.env.SEED_ENABLED === 'true';

export const dynamic = 'force-dynamic';

const TEACHERS_DATA = [
  {
    name: 'Professor Jordan',
    email: 'jordan@coliseuacademia.com.br',
    phone: '5573998111360',
    modalities: ['PILATES', 'CROSSTRAINING'] as ('PILATES' | 'MUSCULACAO' | 'CROSSTRAINING')[],
    isOwner: false,
    hourlyRate: 0,
  },
  {
    name: 'Professora Letícia',
    email: 'leticia@coliseuacademia.com.br',
    phone: '5573981229881',
    modalities: ['PILATES'] as ('PILATES' | 'MUSCULACAO' | 'CROSSTRAINING')[],
    isOwner: false,
    hourlyRate: 0,
  },
  {
    name: 'Professora Laís',
    email: 'lais@coliseuacademia.com.br',
    phone: '5533980009361',
    modalities: ['PILATES'] as ('PILATES' | 'MUSCULACAO' | 'CROSSTRAINING')[],
    isOwner: false,
    hourlyRate: 0,
  },
  {
    name: 'Professor Lucas',
    email: 'lucas@coliseuacademia.com.br',
    phone: '5573982200087',
    modalities: ['MUSCULACAO', 'CROSSTRAINING'] as ('PILATES' | 'MUSCULACAO' | 'CROSSTRAINING')[],
    isOwner: false,
    hourlyRate: 0,
  },
  {
    name: 'Professor Tauan',
    email: 'tauan@coliseuacademia.com.br',
    phone: '5573999511132',
    modalities: ['CROSSTRAINING'] as ('PILATES' | 'MUSCULACAO' | 'CROSSTRAINING')[],
    isOwner: true, // dono / pró-labore
    hourlyRate: 0,
  },
  {
    name: 'Fisio Brunessa',
    email: 'brunessa@coliseuacademia.com.br',
    phone: '5573995629690',
    modalities: ['PILATES'] as ('PILATES' | 'MUSCULACAO' | 'CROSSTRAINING')[],
    isOwner: false,
    hourlyRate: 0,
  },
  {
    name: 'Fisio Carolina',
    email: 'carolina@coliseuacademia.com.br',
    phone: '5573995629691', // mesmo DDD/ramal de Brunessa — ajuste se diferente
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

  const results: { name: string; status: string }[] = [];

  for (const t of TEACHERS_DATA) {
    try {
      // Cria ou atualiza o User
      const dbUser = await prisma.user.upsert({
        where: { email: t.email },
        update: { role: 'TEACHER', name: t.name },
        create: { email: t.email, name: t.name, role: 'TEACHER' },
      });

      // Verifica se já existe um Teacher para este User
      const existing = await prisma.teacher.findUnique({ where: { userId: dbUser.id } });
      if (existing) {
        results.push({ name: t.name, status: 'já existe — ignorado' });
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
  if (!admin) return NextResponse.json({ error: 'forbidden' },
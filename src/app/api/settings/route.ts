// API de Configurações
// GET /api/settings — retorna todas as settings como objeto { key: value }
// PATCH /api/settings — atualiza uma ou várias settings

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Settings são públicas dentro do app (só admins editam, mas todos leem)
  const settings = await prisma.settings.findMany({ orderBy: { key: 'asc' } });
  const obj = Object.fromEntries(settings.map(s => [s.key, s.value]));
  return NextResponse.json(obj);
}

export async function PATCH(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const updates = await req.json() as Record<string, string>;

  await Promise.all(
    Object.entries(updates).map(([key, value]) =>
      prisma.settings.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    )
  );

  return NextResponse.json({ ok: true });
}

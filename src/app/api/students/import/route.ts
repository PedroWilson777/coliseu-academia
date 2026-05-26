// Importação de alunos via CSV
// POST /api/students/import — FormData com campo "file" (CSV)
//
// Formato esperado do CSV (separado por vírgula ou ponto-e-vírgula):
// nome,telefone,modalidade,plano,dia_pagamento,email
//
// modalidade: PILATES | MUSCULACAO | CROSSTRAINING

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface StudentRow {
  name: string;
  phone: string;
  modality: string;
  planName?: string;
  paymentDay?: number;
  email?: string;
}

function parseCSV(text: string): StudentRow[] {
  const lines = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length < 2) return [];

  // Detecta separador
  const sep = lines[0].includes(';') ? ';' : ',';

  const header = lines[0].split(sep).map(h =>
    h.toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9_]/g, '_')
      .trim()
  );

  const rows: StudentRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(sep).map(c => c.trim().replace(/^["']|["']$/g, ''));
    const obj: Record<string, string> = {};
    header.forEach((h, idx) => {
      obj[h] = cells[idx] || '';
    });

    const name = obj['nome'] || obj['name'] || '';
    const phone = (obj['telefone'] || obj['phone'] || obj['celular'] || '').replace(/\D/g, '');
    const modalityRaw = (obj['modalidade'] || obj['modality'] || '').toUpperCase();
    const modality = ['PILATES', 'MUSCULACAO', 'CROSSTRAINING'].includes(modalityRaw)
      ? modalityRaw
      : 'MUSCULACAO'; // padrão

    if (!name || !phone) continue;

    rows.push({
      name,
      phone,
      modality,
      planName: obj['plano'] || obj['plan'] || undefined,
      paymentDay: obj['dia_pagamento'] ? parseInt(obj['dia_pagamento']) : undefined,
      email: obj['email'] || undefined,
    });
  }

  return rows;
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'arquivo não enviado' }, { status: 400 });
  }

  const text = await file.text();
  const rows = parseCSV(text);

  if (rows.length === 0) {
    return NextResponse.json({ error: 'CSV vazio ou formato inválido' }, { status: 400 });
  }

  const results = {
    created: 0,
    skipped: 0,
    errors: [] as string[],
  };

  for (const row of rows) {
    try {
      // Tenta encontrar plano pelo nome (se informado)
      let planId: string | null = null;
      if (row.planName) {
        const plan = await prisma.plan.findFirst({
          where: {
            name: { contains: row.planName, mode: 'insensitive' },
            active: true,
          },
        });
        planId = plan?.id || null;
      }

      // Cria aluno (ignora se telefone já existe)
      await prisma.student.create({
        data: {
          name: row.name,
          phone: row.phone,
          email: row.email || null,
          modality: row.modality as 'PILATES' | 'MUSCULACAO' | 'CROSSTRAINING',
          planId,
          paymentDay: row.paymentDay || null,
          status: 'active',
        },
      });

      results.created++;
    } catch (error: unknown) {
      // P2002 = unique constraint (telefone já existe)
      if ((error as { code?: string }).code === 'P2002') {
        results.skipped++;
      } else {
        results.errors.push(`${row.name} (${row.phone}): ${(error as Error).message}`);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    total: rows.length,
    created: results.created,
    skipped: results.skipped,
    errors: results.errors,
  });
}

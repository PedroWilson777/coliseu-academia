// Endpoint ONE-TIME para criar/atualizar admins no Supabase Auth com senha fixa
// Admins são definidos via ADMIN_EMAILS no .env
// Senha padrão dos admins: adm00
// ⚠️ Só roda se SEED_ENABLED=true

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';

const SEED_ENABLED = process.env.SEED_ENABLED === 'true';
const ADMIN_PASSWORD = 'adm00';

export const dynamic = 'force-dynamic';

export async function POST() {
  if (!SEED_ENABLED) {
    return NextResponse.json(
      { error: 'Seed desabilitado. Defina SEED_ENABLED=true para reativar.' },
      { status: 403 }
    );
  }

  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

  if (adminEmails.length === 0) {
    return NextResponse.json({ error: 'Nenhum ADMIN_EMAILS definido no .env' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const results: { email: string; status: string }[] = [];

  for (const email of adminEmails) {
    try {
      // Garante que existe no Prisma como ADMIN
      await prisma.user.upsert({
        where: { email },
        update: { role: 'ADMIN' },
        create: { email, role: 'ADMIN', name: email.split('@')[0] },
      });

      // Cria no Supabase Auth; se já existe, atualiza a senha
      const { error: createError } = await supabase.auth.admin.createUser({
        email,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { role: 'ADMIN' },
      });

      if (createError && createError.message.includes('already been registered')) {
        const { data: listData } = await supabase.auth.admin.listUsers();
        const existing = listData?.users?.find(u => u.email === email);
        if (existing) {
          await supabase.auth.admin.updateUserById(existing.id, { password: ADMIN_PASSWORD });
          results.push({ email, status: 'senha atualizada' });
        } else {
          results.push({ email, status: 'já existe mas não encontrado para atualizar' });
        }
      } else if (createError) {
        results.push({ email, status: `erro: ${createError.message}` });
      } else {
        results.push({ email, status: 'criado' });
      }
    } catch (err) {
      results.push({ email, status: `erro: ${err instanceof Error ? err.message : 'desconhecido'}` });
    }
  }

  return NextResponse.json({ ok: true, admins: results });
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

  return NextResponse.json({
    message: 'Faça POST para criar/atualizar senhas dos admins',
    admins: adminEmails,
    password: ADMIN_PASSWORD,
  });
}

// Helpers de autenticação - usa Supabase pro login + sincroniza com Prisma User table

import { createClient } from './supabase-server';
import { prisma } from './prisma';
import type { UserRole } from '@prisma/client';

const adminEmails = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return adminEmails.includes(email.toLowerCase());
}

export interface AuthUser {
  id: string;             // ID do User no Prisma
  supabaseId: string;     // ID do Supabase Auth
  email: string;
  name: string | null;
  image: string | null;
  role: UserRole;
  teacherId?: string;
}

/**
 * Pega o usuário atual da sessão (server-side).
 * Faz upsert no Prisma se for o primeiro login.
 * Auto-promove pra ADMIN se o email tá em ADMIN_EMAILS.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = createClient();
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();

  if (!supabaseUser?.email) return null;

  const email = supabaseUser.email.toLowerCase();
  const isAdmin = isAdminEmail(email);

  // Verifica se já existe no Prisma
  let dbUser = await prisma.user.findUnique({
    where: { email },
    include: { teacher: true },
  });

  if (!dbUser) {
    // Primeiro login - cria no Prisma
    dbUser = await prisma.user.create({
      data: {
        email,
        supabaseId: supabaseUser.id,
        name: supabaseUser.user_metadata?.name || email.split('@')[0],
        image: supabaseUser.user_metadata?.avatar_url || null,
        role: isAdmin ? 'ADMIN' : 'PENDING',
      },
      include: { teacher: true },
    });
  } else if (isAdmin && dbUser.role !== 'ADMIN') {
    // Auto-promove pra admin se tá na lista mas ainda não é
    dbUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        role: 'ADMIN',
        supabaseId: supabaseUser.id,
      },
      include: { teacher: true },
    });
  } else if (!dbUser.supabaseId) {
    // Sincroniza supabaseId se ainda não tem
    dbUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: { supabaseId: supabaseUser.id },
      include: { teacher: true },
    });
  }

  return {
    id: dbUser.id,
    supabaseId: supabaseUser.id,
    email: dbUser.email,
    name: dbUser.name,
    image: dbUser.image,
    role: dbUser.role,
    teacherId: dbUser.teacher?.id,
  };
}

/**
 * Garante que o usuário tá logado. Usa em API routes.
 * Retorna o user ou null (e a API decide o que fazer).
 */
export async function requireAuth(): Promise<AuthUser | null> {
  return getCurrentUser();
}

/**
 * Garante que o usuário é ADMIN. Use em API routes.
 */
export async function requireAdmin(): Promise<AuthUser | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') return null;
  return user;
}

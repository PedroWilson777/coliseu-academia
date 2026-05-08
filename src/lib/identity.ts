// Identifica se um número é aluno cadastrado ou lead novo

import { prisma } from './prisma';

export type Identity =
  | { type: 'STUDENT'; student: { id: string; name: string; phone: string } }
  | { type: 'LEAD'; lead: { id: string; name: string | null; phone: string } };

export async function identifyByPhone(phone: string, pushName?: string): Promise<Identity> {
  // 1. Tenta achar como aluno
  const student = await prisma.student.findUnique({ where: { phone } });

  if (student) {
    return {
      type: 'STUDENT',
      student: { id: student.id, name: student.name, phone: student.phone },
    };
  }

  // 2. Senão, busca/cria lead
  let lead = await prisma.lead.findUnique({ where: { phone } });
  if (!lead) {
    lead = await prisma.lead.create({
      data: { phone, name: pushName },
    });
    console.log(`👤 Novo lead: ${phone} (${pushName || 'sem nome'})`);
  }

  return {
    type: 'LEAD',
    lead: { id: lead.id, name: lead.name, phone: lead.phone },
  };
}

export async function getOrCreateConversation(identity: Identity) {
  const where = identity.type === 'STUDENT'
    ? { studentId: identity.student.id, status: { not: 'RESOLVED' as const } }
    : { leadId: identity.lead.id, status: { not: 'RESOLVED' as const } };

  let conversation = await prisma.conversation.findFirst({
    where,
    orderBy: { lastMessageAt: 'desc' },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: identity.type === 'STUDENT'
        ? { studentId: identity.student.id, status: 'AI_ACTIVE' }
        : { leadId: identity.lead.id, status: 'AI_ACTIVE' },
    });
  }

  return conversation;
}

// Identifica se um numero e aluno cadastrado ou lead novo

import { prisma } from './prisma';
import { normalizePhone } from './evolution';

export type Identity =
  | { type: 'STUDENT'; student: { id: string; name: string; phone: string } }
  | { type: 'LEAD'; lead: { id: string; name: string | null; phone: string } };

/**
 * Gera variantes de busca para o telefone:
 * - Com DDI 55: "5573991234567"
 * - Sem DDI 55: "73991234567"
 * - Com/sem 9 digito (migracao BR)
 * Cobre desalinhamento entre formato do banco e formato do WhatsApp.
 */
function phoneSearchVariants(phone: string): string[] {
  const withDDI = normalizePhone(phone);
  const withoutDDI = withDDI.startsWith('55') ? withDDI.slice(2) : withDDI;

  const variants = new Set<string>([withDDI, withoutDDI, phone.replace(/\D/g, '')]);

  for (const v of [withDDI, withoutDDI]) {
    const digits = v.replace(/\D/g, '');
    const areaOffset = v.startsWith('55') ? 4 : 2;
    const localNumber = digits.slice(areaOffset);
    if (localNumber.length === 8) {
      variants.add(digits.slice(0, areaOffset) + '9' + localNumber);
    }
    if (localNumber.length === 9 && localNumber.startsWith('9')) {
      variants.add(digits.slice(0, areaOffset) + localNumber.slice(1));
    }
  }

  return Array.from(variants);
}

export async function identifyByPhone(phone: string, pushName?: string): Promise<Identity> {
  const variants = phoneSearchVariants(phone);

  // 1. Tenta achar como aluno (tenta todas as variantes de formato)
  const student = await prisma.student.findFirst({
    where: { phone: { in: variants } },
  });

  if (student) {
    return {
      type: 'STUDENT',
      student: { id: student.id, name: student.name, phone: student.phone },
    };
  }

  // 2. Busca/cria lead (tenta todas as variantes)
  let lead = await prisma.lead.findFirst({
    where: { phone: { in: variants } },
  });

  if (!lead) {
    const normalizedPhone = normalizePhone(phone);
    lead = await prisma.lead.create({
      data: { phone: normalizedPhone, name: pushName },
    });
    console.log('Novo lead: ' + normalizedPhone + ' (' + (pushName || 'sem nome') + ')');
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

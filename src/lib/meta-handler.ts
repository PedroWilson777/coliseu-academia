// Processa as META tags retornadas pela Atena

import { prisma } from './prisma';
import type { MetaTag } from './claude';
import { sendWhatsAppImage } from './evolution';
import type { Modality } from '@prisma/client';

export async function processMetaTags(
  tags: MetaTag[],
  conversationId: string,
  leadId: string,
  phone: string,
  appUrl: string
): Promise<void> {
  for (const tag of tags) {
    try {
      if (tag.type === 'EXPERIMENTAL') {
        await handleExperimental(tag, leadId);
      } else if (tag.type === 'ENVIAR_PLANOS') {
        await handleSendPlans(tag, leadId, phone, appUrl);
      } else if (tag.type === 'FECHAMENTO') {
        await handleClosing(tag, leadId, conversationId);
      } else if (tag.type === 'ESCALAR') {
        await handleEscalation(tag, conversationId);
      }
    } catch (error) {
      console.error(`❌ Erro META ${tag.type}:`, error);
    }
  }
}

async function handleExperimental(tag: MetaTag, leadId: string) {
  const { modalidade, data, hora } = tag.params;
  if (!modalidade || !data || !hora) return;

  const modalityMap: Record<string, Modality> = {
    PILATES: 'PILATES',
    MUSCULACAO: 'MUSCULACAO',
    CROSSTRAINING: 'CROSSTRAINING',
  };
  const modality = modalityMap[modalidade.toUpperCase()];
  if (!modality) return;

  const scheduledAt = new Date(`${data}T${hora}:00-03:00`);
  if (isNaN(scheduledAt.getTime())) return;

  // Pega qualquer professor da modalidade
  const teacher = await prisma.teacher.findFirst({
    where: { active: true, modalities: { has: modality } },
  });

  if (!teacher) {
    console.warn('⚠️ Sem professor cadastrado pra', modality);
    return;
  }

  await prisma.appointment.create({
    data: {
      leadId,
      teacherId: teacher.id,
      modality,
      scheduledAt,
      type: 'EXPERIMENTAL',
      status: 'SCHEDULED',
    },
  });

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      stage: 'EXPERIMENTAL',
      interestedModality: modality,
      qualification: 'WARM',
    },
  });

  console.log(`💪 Aula experimental marcada: ${modality} ${scheduledAt.toLocaleString('pt-BR')}`);
}

async function handleSendPlans(tag: MetaTag, leadId: string, phone: string, appUrl: string) {
  const { modalidade } = tag.params;
  if (!modalidade) return;

  const modalityToImage: Record<string, string> = {
    PILATES: 'pilates.jpeg',
    MUSCULACAO: 'musculacao.jpeg',
    CROSSTRAINING: 'crosstraining.jpeg',
  };

  const imageName = modalityToImage[modalidade.toUpperCase()];
  if (!imageName) return;

  const imageUrl = `${appUrl}/planos/${imageName}`;

  await sendWhatsAppImage(phone, imageUrl);

  // Atualiza interesse do lead
  const modalityMap: Record<string, Modality> = {
    PILATES: 'PILATES',
    MUSCULACAO: 'MUSCULACAO',
    CROSSTRAINING: 'CROSSTRAINING',
  };
  const modality = modalityMap[modalidade.toUpperCase()];

  if (modality) {
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        interestedModality: modality,
        qualification: 'WARM',
        stage: 'QUALIFIED',
      },
    });
  }

  console.log(`📷 Foto de planos enviada: ${modalidade}`);
}

async function handleClosing(tag: MetaTag, leadId: string, conversationId: string) {
  const { modalidade, plano, valor, pagamento } = tag.params;

  const modalityMap: Record<string, Modality> = {
    PILATES: 'PILATES',
    MUSCULACAO: 'MUSCULACAO',
    CROSSTRAINING: 'CROSSTRAINING',
  };
  const modality = modalidade ? modalityMap[modalidade.toUpperCase()] : undefined;

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      stage: 'CLOSING',
      qualification: 'HOT',
      interestedModality: modality,
      interestedPlan: plano,
      paymentMethod: pagamento,
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { status: 'WAITING_HUMAN' },
  });

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });

  await prisma.supervisorNotification.create({
    data: {
      conversationId,
      type: 'NEW_CLOSING_LEAD',
      severity: 'HIGH',
      title: `🔥 Lead pronto pra fechar: ${lead?.name || 'Sem nome'}`,
      detail: `${plano || 'plano'} (R$ ${valor || '?'}) · pagamento: ${pagamento || '?'}`,
    },
  });

  console.log(`🔥 Lead em fechamento: ${lead?.name} - ${plano}`);
}

async function handleEscalation(tag: MetaTag, conversationId: string) {
  const { motivo, severidade } = tag.params;
  const sev = (severidade || 'MEDIUM').toUpperCase();
  const validSev = ['HIGH', 'MEDIUM', 'LOW'].includes(sev) ? sev : 'MEDIUM';

  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { lead: true, student: true },
  });

  if (!conv) return;

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { status: 'WAITING_HUMAN' },
  });

  const personName = conv.lead?.name || conv.student?.name || 'Cliente';

  await prisma.supervisorNotification.create({
    data: {
      conversationId,
      type: 'ESCALATION',
      severity: validSev as 'HIGH' | 'MEDIUM' | 'LOW',
      title: `${personName} precisa de atendimento`,
      detail: motivo || 'Atena escalou esta conversa',
    },
  });

  console.log(`🚨 Escalado: ${motivo}`);
}

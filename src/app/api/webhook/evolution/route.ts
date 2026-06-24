// Webhook que recebe mensagens da Evolution API
// URL: POST /api/webhook/evolution

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { askAtena } from '@/lib/claude';
import { sendWhatsAppMessage, downloadWhatsAppMedia } from '@/lib/evolution';
import { processMetaTags } from '@/lib/meta-handler';
import { transcribeAudioFromBase64 } from '@/lib/whisper';
import { identifyByPhone, getOrCreateConversation } from '@/lib/identity';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.EVOLUTION_WEBHOOK_SECRET;
  if (webhookSecret) {
    const apiKey = req.headers.get('apikey') || req.headers.get('x-api-key');
    if (apiKey !== webhookSecret) {
      console.warn('Webhook rejeitado: apikey invalida');
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  }

  try {
    const body = await req.json();
    console.log('Webhook recebido:', JSON.stringify(body).slice(0, 200));

    if (body?.event !== 'messages.upsert') {
      return NextResponse.json({ ok: true, ignored: body?.event });
    }

    const data = body?.data;
    if (!data) return NextResponse.json({ ok: true });

    if (data?.key?.fromMe === true) {
      return NextResponse.json({ ok: true, ignored: 'fromMe' });
    }

    const remoteJid = data?.key?.remoteJid;
    const messageId = data?.key?.id;
    if (!remoteJid) return NextResponse.json({ ok: true });

    if (remoteJid.includes('@g.us')) {
      return NextResponse.json({ ok: true, ignored: 'group' });
    }

    const phone = remoteJid.split('@')[0];
    const pushName = data?.pushName || null;

    // EXTRACAO DE TEXTO OU AUDIO
    let messageText =
      data?.message?.conversation ||
      data?.message?.extendedTextMessage?.text ||
      data?.message?.imageMessage?.caption ||
      '';

    let isAudio = false;
    let audioTranscript = '';
    let audioBase64: string | null = null;

    if (data?.message?.audioMessage) {
      isAudio = true;
      console.log('Mensagem de audio detectada, transcrevendo...');
      const media = await downloadWhatsAppMedia(messageId);
      if (media?.base64) {
        audioBase64 = 'data:' + (media.mimetype || 'audio/ogg') + ';base64,' + media.base64;
        audioTranscript = await transcribeAudioFromBase64(media.base64);
        messageText = audioTranscript || '[audio sem transcricao]';
        console.log('Transcrito: "' + audioTranscript.slice(0, 80) + '"');
      }
    }

    if (!messageText) {
      return NextResponse.json({ ok: true, ignored: 'no content' });
    }

    // Idempotencia
    if (messageId) {
      const existing = await prisma.message.findUnique({
        where: { whatsappMessageId: messageId },
      });
      if (existing) return NextResponse.json({ ok: true, ignored: 'duplicate' });
    }

    // IDENTIFICACAO: ALUNO OU LEAD?
    const identity = await identifyByPhone(phone, pushName);
    const conversation = await getOrCreateConversation(identity);

    // Salva mensagem do cliente
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        sender: 'CLIENT',
        content: messageText,
        whatsappMessageId: messageId || null,
        isAudio,
        audioTranscript: audioTranscript || null,
        audioBase64: audioBase64 || null,
      },
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        unreadCount: { increment: 1 },
      },
    });

    // HUMANO TA ATENDENDO?
    if (conversation.status === 'HUMAN_ACTIVE') {
      console.log('Humano atendendo, Atena nao responde');
      return NextResponse.json({ ok: true, handled: 'human' });
    }

    if (conversation.status === 'WAITING_HUMAN') {
      console.log('Aguardando humano');
      return NextResponse.json({ ok: true, handled: 'waiting' });
    }

    // ALUNOS: Atena responde com FAQ, escalando quando necessário
    const isStudent = identity.type === 'STUDENT';
    const studentName = isStudent ? identity.student.name : undefined;

    // ATENA RESPONDE (leads e alunos — alunos usam prompt de FAQ/suporte)
    try {
      const atena = await askAtena(conversation.id, isStudent, studentName);

      // Salva resposta
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          sender: 'AI',
          content: atena.text,
          metaTags: atena.metaTags.length > 0 ? JSON.parse(JSON.stringify(atena.metaTags)) : undefined,
        },
      });

      // Processa META tags (só para leads — alunos não têm lead.id)
      if (atena.metaTags.length > 0 && !isStudent) {
        const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || '';
        await processMetaTags(
          atena.metaTags,
          conversation.id,
          identity.lead.id,
          phone,
          appUrl
        );
      }

      // Se Atena escalou aluno → notifica supervisor
      if (isStudent && atena.metaTags.some(t => t.type === 'ESCALAR' || t.type === 'ALUNO_INATIVO')) {
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { status: 'WAITING_HUMAN' },
        });
        const existingNotif = await prisma.supervisorNotification.findFirst({
          where: { conversationId: conversation.id, type: 'ESCALATION', resolvedAt: null },
        });
        if (!existingNotif) {
          const motivo = atena.metaTags.find(t => t.type === 'ESCALAR')?.params?.motivo || 'Aluno precisa de atendimento';
          await prisma.supervisorNotification.create({
            data: {
              conversationId: conversation.id,
              type: 'ESCALATION',
              severity: 'MEDIUM',
              title: (studentName || 'Aluno') + ' precisa de atendimento',
              detail: motivo,
            },
          });
        }
      }

      // Envia texto da resposta — loga falha e notifica supervisor
      if (atena.text) {
        const sent = await sendWhatsAppMessage(phone, atena.text);
        if (!sent) {
          console.error('FALHA ao entregar Atena para ' + phone + ' (conversa ' + conversation.id + ')');
          await prisma.supervisorNotification.create({
            data: {
              conversationId: conversation.id,
              type: 'AI_FAILED',
              severity: 'HIGH',
              title: 'Falha ao enviar mensagem para o lead',
              detail: 'Atena gerou resposta mas Evolution nao conseguiu entregar para ' + phone + '. Numero pode estar sem WhatsApp ou com formato invalido.',
            },
          });
        }
      }

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      });

      return NextResponse.json({ ok: true, handled: 'atena' });
    } catch (error) {
      console.error('Erro Atena:', error);

      const fallback = 'Oi! Recebi sua mensagem. Estou com uma instabilidade momentanea, em breve te respondo.';
      await sendWhatsAppMessage(phone, fallback);

      await prisma.supervisorNotification.create({
        data: {
          conversationId: conversation.id,
          type: 'AI_FAILED',
          severity: 'HIGH',
          title: 'Atena falhou em responder',
          detail: 'Erro: ' + (error instanceof Error ? error.message : 'desconhecido'),
        },
      });

      return NextResponse.json({ ok: true, handled: 'fallback' });
    }
  } catch (error) {
    console.error('Erro fatal webhook:', error);
    return NextResponse.json({ ok: false, error: 'internal' }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'coliseu-webhook',
    timestamp: new Date().toISOString(),
  });
}

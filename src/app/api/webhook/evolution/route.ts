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
  try {
    const body = await req.json();
    console.log('📨 Webhook:', JSON.stringify(body).slice(0, 200));

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

    // ============== EXTRAÇÃO DE TEXTO OU ÁUDIO ==============
    let messageText =
      data?.message?.conversation ||
      data?.message?.extendedTextMessage?.text ||
      data?.message?.imageMessage?.caption ||
      '';

    let isAudio = false;
    let audioTranscript = '';

    // Áudio
    if (data?.message?.audioMessage) {
      isAudio = true;
      console.log('🎤 Mensagem de áudio detectada, transcrevendo...');

      const media = await downloadWhatsAppMedia(messageId);
      if (media?.base64) {
        audioTranscript = await transcribeAudioFromBase64(media.base64);
        messageText = audioTranscript || '[áudio sem transcrição]';
        console.log(`🎤 Transcrito: "${audioTranscript.slice(0, 80)}..."`);
      }
    }

    if (!messageText) {
      return NextResponse.json({ ok: true, ignored: 'no content' });
    }

    // Idempotência
    if (messageId) {
      const existing = await prisma.message.findUnique({
        where: { whatsappMessageId: messageId },
      });
      if (existing) return NextResponse.json({ ok: true, ignored: 'duplicate' });
    }

    // ============== IDENTIFICAÇÃO: ALUNO OU LEAD? ==============
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
      },
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        unreadCount: { increment: 1 },
      },
    });

    // ============== HUMANO TÁ ATENDENDO? ==============
    if (conversation.status === 'HUMAN_ACTIVE') {
      console.log('🙋 Humano atendendo, Atena não responde');
      return NextResponse.json({ ok: true, handled: 'human' });
    }

    if (conversation.status === 'WAITING_HUMAN') {
      console.log('⏳ Aguardando humano');
      return NextResponse.json({ ok: true, handled: 'waiting' });
    }

    // ============== REGRA: ATENA SÓ ATENDE LEADS, NÃO ALUNOS ==============
    if (identity.type === 'STUDENT') {
      console.log(`👤 Aluno ${identity.student.name} mandou mensagem - escalando pro humano sem resposta`);

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { status: 'WAITING_HUMAN' },
      });

      // Notifica supervisor (só uma vez por conversa pra não ficar spammando)
      const existingNotif = await prisma.supervisorNotification.findFirst({
        where: {
          conversationId: conversation.id,
          type: 'ESCALATION',
          resolvedAt: null,
        },
      });

      if (!existingNotif) {
        await prisma.supervisorNotification.create({
          data: {
            conversationId: conversation.id,
            type: 'ESCALATION',
            severity: 'MEDIUM',
            title: `${identity.student.name} (aluno) precisa de atendimento`,
            detail: `Aluno cadastrado mandou mensagem. Atena não responde alunos - assumir manualmente.`,
          },
        });
      }

      return NextResponse.json({ ok: true, handled: 'student-no-reply' });
    }

    // ============== ATENA RESPONDE (só pra LEAD) ==============
    try {
      const atena = await askAtena(conversation.id, false, undefined);

      // Salva resposta
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          sender: 'AI',
          content: atena.text,
          metaTags: atena.metaTags.length > 0 ? JSON.parse(JSON.stringify(atena.metaTags)) : undefined,
        },
      });

      // Processa META tags (sempre lead aqui, alunos não chegam nesse ponto)
      if (atena.metaTags.length > 0) {
        const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || '';
        await processMetaTags(
          atena.metaTags,
          conversation.id,
          identity.lead.id,
          phone,
          appUrl
        );
      }

      // Envia texto da resposta
      if (atena.text) {
        await sendWhatsAppMessage(phone, atena.text);
      }

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      });

      return NextResponse.json({ ok: true, handled: 'atena' });
    } catch (error) {
      console.error('❌ Erro Atena:', error);

      const fallback =
        'Oi! Recebi sua mensagem 🙏 Estou com uma instabilidade momentânea, em breve te respondo.';

      await sendWhatsAppMessage(phone, fallback);

      await prisma.supervisorNotification.create({
        data: {
          conversationId: conversation.id,
          type: 'AI_FAILED',
          severity: 'HIGH',
          title: 'Atena falhou em responder',
          detail: `Erro: ${error instanceof Error ? error.message : 'desconhecido'}`,
        },
      });

      return NextResponse.json({ ok: true, handled: 'fallback' });
    }
  } catch (error) {
    console.error('❌ Erro fatal webhook:', error);
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

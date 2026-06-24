// POST /api/conversations/[id]/media — envia imagem ou vídeo pelo dashboard
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { normalizePhone } from '@/lib/evolution';

const EVOLUTION_URL = process.env.EVOLUTION_API_URL!;
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY!;
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'coliseu';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const { mediaBase64, mediaType, mimeType, fileName, caption } = await req.json();

    if (!mediaBase64 || !mediaType || !mimeType || !fileName) {
      return NextResponse.json({ error: 'Dados de mídia incompletos' }, { status: 400 });
    }

    const conv = await prisma.conversation.findUnique({
      where: { id: params.id },
      include: { lead: true, student: true },
    });

    if (!conv) return NextResponse.json({ error: 'not found' }, { status: 404 });

    if (conv.status !== 'HUMAN_ACTIVE' && conv.status !== 'WAITING_HUMAN') {
      return NextResponse.json({ error: 'Pause a Atena antes de enviar mídia' }, { status: 400 });
    }

    const rawPhone = conv.lead?.phone || conv.student?.phone;
    if (!rawPhone) return NextResponse.json({ error: 'Sem número de telefone' }, { status: 400 });

    const phone = normalizePhone(rawPhone);

    // Envia via Evolution API
    const res = await fetch(`${EVOLUTION_URL}/message/sendMedia/${EVOLUTION_INSTANCE}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: EVOLUTION_KEY },
      body: JSON.stringify({
        number: phone,
        mediatype: mediaType,
        mimetype: mimeType,
        caption: caption || '',
        media: mediaBase64,
        fileName,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Evolution media erro:', res.status, err);
      return NextResponse.json(
        { error: 'Falha ao enviar mídia. Verifique a conexão com a Evolution API.' },
        { status: 207 }
      );
    }

    // Salva no histórico
    const emoji = mediaType === 'video' ? '🎬' : '📷';
    const label = mediaType === 'video' ? 'Vídeo' : 'Imagem';
    const content = caption ? `${emoji} ${label}: "${caption}"` : `${emoji} ${label} enviado`;

    await prisma.message.create({
      data: {
        conversationId: params.id,
        sender: 'HUMAN',
        content,
        authorName: user.name || user.email,
      },
    });

    await prisma.conversation.update({
      where: { id: params.id },
      data: { lastMessageAt: new Date(), assignedHuman: user.name || user.email },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('POST /conversations/[id]/media:', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

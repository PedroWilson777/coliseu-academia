import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { sendWhatsAppAudio } from '@/lib/evolution';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const conv = await prisma.conversation.findUnique({
    where: { id: params.id },
    include: { lead: true, student: true },
  });

  if (!conv) return NextResponse.json({ error: 'not found' }, { status: 404 });

  if (conv.status !== 'HUMAN_ACTIVE' && conv.status !== 'WAITING_HUMAN') {
    return NextResponse.json({ error: 'pause IA antes' }, { status: 400 });
  }

  const formData = await req.formData();
  const audioFile = formData.get('audio') as File | null;

  if (!audioFile) {
    return NextResponse.json({ error: 'áudio não enviado' }, { status: 400 });
  }

  // Converte blob para base64
  const arrayBuffer = await audioFile.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');

  // Envia via Evolution API
  const phone = conv.lead?.phone || conv.student?.phone;
  if (phone) {
    const sent = await sendWhatsAppAudio(phone, base64);
    if (!sent) {
      return NextResponse.json({ error: 'falha ao enviar áudio' }, { status: 500 });
    }
  }

  // Salva no banco
  const message = await prisma.message.create({
    data: {
      conversationId: params.id,
      sender: 'HUMAN',
      content: '[áudio]',
      isAudio: true,
      authorName: user.name || user.email,
    },
  });

  await prisma.conversation.update({
    where: { id: params.id },
    data: {
      status: 'HUMAN_ACTIVE',
      lastMessageAt: new Date(),
      assignedHuman: user.name || user.email,
    },
  });

  return NextResponse.json({ ok: true, id: message.id });
}

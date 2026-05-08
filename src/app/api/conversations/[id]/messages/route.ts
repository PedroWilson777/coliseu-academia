import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { sendWhatsAppMessage } from '@/lib/evolution';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: 'empty' }, { status: 400 });

  const conv = await prisma.conversation.findUnique({
    where: { id: params.id },
    include: { lead: true, student: true },
  });

  if (!conv) return NextResponse.json({ error: 'not found' }, { status: 404 });

  if (conv.status !== 'HUMAN_ACTIVE' && conv.status !== 'WAITING_HUMAN') {
    return NextResponse.json({ error: 'pause IA antes' }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: {
      conversationId: params.id,
      sender: 'HUMAN',
      content: content.trim(),
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

  const phone = conv.lead?.phone || conv.student?.phone;
  if (phone) await sendWhatsAppMessage(phone, content.trim());

  return NextResponse.json({ ok: true, id: message.id });
}

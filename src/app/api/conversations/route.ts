import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const conversations = await prisma.conversation.findMany({
    where: { status: { not: 'RESOLVED' } },
    include: {
      lead: true,
      student: true,
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { lastMessageAt: 'desc' },
    take: 100,
  });

  const formatted = conversations.map(c => {
    const isStudent = !!c.student;
    const person = c.student || c.lead;
    return {
      id: c.id,
      type: isStudent ? 'STUDENT' : 'LEAD',
      name: person?.name || person?.phone || 'Sem nome',
      phone: person?.phone || '',
      qualification: c.lead?.qualification || null,
      stage: c.lead?.stage || null,
      status: c.status,
      assignedHuman: c.assignedHuman,
      unreadCount: c.unreadCount,
      lastMessage: c.messages[0]?.content || '',
      lastMessageAt: c.lastMessageAt,
      lastMessageSender: c.messages[0]?.sender,
      isAudio: c.messages[0]?.isAudio || false,
    };
  });

  return NextResponse.json(formatted);
}

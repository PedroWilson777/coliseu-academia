import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface RouteParams { params: { id: string } }

export async function GET(req: NextRequest, { params }: RouteParams) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const conv = await prisma.conversation.findUnique({
    where: { id: params.id },
    include: {
      lead: true,
      student: { include: { plan: true } },
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!conv) return NextResponse.json({ error: 'not found' }, { status: 404 });

  await prisma.conversation.update({
    where: { id: params.id },
    data: { unreadCount: 0 },
  });

  const isStudent = !!conv.student;
  const person = conv.student || conv.lead;

  return NextResponse.json({
    id: conv.id,
    status: conv.status,
    assignedHuman: conv.assignedHuman,
    type: isStudent ? 'STUDENT' : 'LEAD',
    person: {
      id: person?.id,
      name: person?.name,
      phone: person?.phone,
      ...(conv.lead && {
        qualification: conv.lead.qualification,
        stage: conv.lead.stage,
        notes: conv.lead.notes,
        interestedModality: conv.lead.interestedModality,
        interestedPlan: conv.lead.interestedPlan,
        paymentMethod: conv.lead.paymentMethod,
        experimentalDone: conv.lead.experimentalDone,
      }),
      ...(conv.student && {
        modality: conv.student.modality,
        plan: conv.student.plan?.name,
        paymentDay: conv.student.paymentDay,
        notes: conv.student.notes,
      }),
    },
    messages: conv.messages.map(m => ({
      id: m.id,
      sender: m.sender,
      content: m.content,
      authorName: m.authorName,
      createdAt: m.createdAt,
      isAudio: m.isAudio,
      audioTranscript: m.audioTranscript,
      audioBase64: m.audioBase64,
    })),
  });
}

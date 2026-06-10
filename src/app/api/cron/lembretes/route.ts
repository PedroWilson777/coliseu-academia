// Cron job: lembretes de aula experimental e follow-up pos-aula
// Chamado a cada 5-10 minutos pelo Railway Cron
// Protegido por CRON_SECRET header

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/evolution';

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret');
    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
          }

            const now = new Date();
              let remindersSent = 0;
                let followupsSent = 0;

                  // 1. Lembretes 30 minutos antes
                    const reminderFrom = new Date(now.getTime() + 25 * 60 * 1000);
                      const reminderTo   = new Date(now.getTime() + 35 * 60 * 1000);

                        const upcoming = await prisma.appointment.findMany({
                            where: {
                                  scheduledAt: { gte: reminderFrom, lte: reminderTo },
                                        status: { in: ['SCHEDULED', 'CONFIRMED'] },
                                              reminderSentAt: null,
                                                  },
                                                      include: {
                                                            lead: { select: { name: true, phone: true } },
                                                                  student: { select: { name: true, phone: true } },
                                                                      },
                                                                        });

                                                                          for (const appt of upcoming) {
                                                                              const phone = appt.lead?.phone ?? appt.student?.phone;
                                                                                  const name  = appt.lead?.name  ?? appt.student?.name  ?? '';
                                                                                      if (!phone) continue;
                                                                                          const horario = appt.scheduledAt.toLocaleTimeString('pt-BR', {
                                                                                                hour: '2-digit', minute: '2-digit', timeZone: 'America/Bahia',
                                                                                                    });
                                                                                                        const msg = `Ola${name ? ', ' + name : ''}! Passando para lembrar que sua aula experimental sera hoje as ${horario}. Estamos te esperando! Caso tenha algum imprevisto, nos avise.`;
                                                                                                            try {
                                                                                                                  await sendWhatsAppMessage(phone, msg);
                                                                                                                        await prisma.appointment.update({ where: { id: appt.id }, data: { reminderSentAt: now } });
                                                                                                                              remindersSent++;
                                                                                                                                  } catch (err) { console.error('Erro lembrete', err); }
                                                                                                                                    }

                                                                                                                                      // 2. Follow-up 1h30 apos aula experimental
                                                                                                                                        const followupFrom = new Date(now.getTime() - 100 * 60 * 1000);
                                                                                                                                          const followupTo   = new Date(now.getTime() -  80 * 60 * 1000);

                                                                                                                                            const pastExp = await prisma.appointment.findMany({
                                                                                                                                                where: {
                                                                                                                                                      scheduledAt: { gte: followupFrom, lte: followupTo },
                                                                                                                                                            type: 'EXPERIMENTAL',
                                                                                                                                                                  status: { in: ['SCHEDULED', 'CONFIRMED', 'COMPLETED'] },
                                                                                                                                                                        followupSentAt: null,
                                                                                                                                                                            },
                                                                                                                                                                                include: {
                                                                                                                                                                                      lead: { select: { name: true, phone: true } },
                                                                                                                                                                                            student: { select: { name: true, phone: true } },
                                                                                                                                                                                                },
                                                                                                                                                                                                  });

                                                                                                                                                                                                    for (const appt of pastExp) {
                                                                                                                                                                                                        const phone = appt.lead?.phone ?? appt.student?.phone;
                                                                                                                                                                                                            const name  = appt.lead?.name  ?? appt.student?.name  ?? '';
                                                                                                                                                                                                                if (!phone) continue;
                                                                                                                                                                                                                    const msg = `Ola${name ? ', ' + name : ''}! Espero que tenha curtido a aula experimental de hoje! O que achou da nossa academia? Quer garantir sua matricula? Estou aqui pra te ajudar!`;
                                                                                                                                                                                                                        try {
                                                                                                                                                                                                                              await sendWhatsAppMessage(phone, msg);
                                                                                                                                                                                                                                    await prisma.appointment.update({ where: { id: appt.id }, data: { followupSentAt: now } });
                                                                                                                                                                                                                                          followupsSent++;
                                                                                                                                                                                                                                              } catch (err) { console.error('Erro followup', err); }
                                                                                                                                                                                                                                                }

                                                                                                                                                                                                                                                  return NextResponse.json({ ok: true, remindersSent, followupsSent, checkedAt: now.toISOString() });
                                                                                                                                                                                                                                                  }
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';

interface Notification {
  id: string;
  type: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  detail: string;
  read: boolean;
  createdAt: string;
  conversationId: string | null;
  conversation: {
    id: string;
    lead: { name: string | null; phone: string } | null;
    student: { name: string; phone: string } | null;
  } | null;
}

export default function SupervisorPage() {
  return <AppShell><Content /></AppShell>;
}

function Content() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const load = async () => {
    const res = await fetch('/api/notifications');
    if (res.ok) setNotifications(await res.json());
  };

  useEffect(() => {
    load();
    const i = setInterval(load, 8000);
    return () => clearInterval(i);
  }, []);

  const handleResolve = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    load();
  };

  return (
    <div className="animate-fade-up">
      <div className="px-10 pt-8 pb-6" style={{ borderBottom: '1px solid var(--border)' }}>
        <h1 className="font-display text-5xl tracking-tight leading-none mb-2 brand-glow">SUPERVISOR</h1>
        <p style={{ color: 'var(--text-2)' }}>{notifications.length} notificações pendentes</p>
      </div>

      <div className="px-10 py-7 max-w-[900px]">
        {notifications.length === 0 ? (
          <div className="text-center py-20" style={{ color: 'var(--text-3)' }}>
            <div className="text-4xl mb-3">✨</div>
            <p>Nenhuma notificação pendente.</p>
            <p className="text-xs mt-2">Tudo sob controle!</p>
          </div>
        ) : (
          notifications.map(n => {
            const sevColor = n.severity === 'HIGH' ? 'var(--danger)' : n.severity === 'MEDIUM' ? 'var(--warning)' : 'var(--ai)';
            const person = n.conversation?.lead || n.conversation?.student;

            return (
              <div
                key={n.id}
                className="rounded-xl p-4 mb-3"
                style={{ background: 'var(--surface)', border: `1px solid ${sevColor}` }}
              >
                <div className="flex justify-between items-start gap-3 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: 'var(--bg-2)', color: sevColor }}>
                        {n.severity}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
                        {n.type}
                      </span>
                    </div>
                    <div className="font-medium text-sm">{n.title}</div>
                  </div>
                  <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                    {new Date(n.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-sm mb-3" style={{ color: 'var(--text-2)' }}>{n.detail}</p>

                {person && (
                  <div className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>
                    👤 {person.name || 'Sem nome'} · <span className="font-mono">{person.phone}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  {n.conversationId && (
                    <button
                      onClick={() => router.push(`/chat?id=${n.conversationId}`)}
                      className="px-3 py-1.5 rounded text-xs font-medium"
                      style={{ background: 'var(--accent)', color: 'white' }}
                    >
                      Abrir conversa
                    </button>
                  )}
                  <button
                    onClick={() => handleResolve(n.id)}
                    className="px-3 py-1.5 rounded text-xs"
                    style={{ background: 'var(--bg-2)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
                  >
                    Marcar como resolvido
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';

interface AppointmentItem {
  id: string;
  scheduledAt: string;
  modality: string;
  type: string;
  status: string;
  teacher: { name: string };
  lead: { name: string | null; phone: string } | null;
  student: { name: string; phone: string } | null;
}

export default function AgendaPage() {
  return <AppShell><Content /></AppShell>;
}

function Content() {
  const [items, setItems] = useState<AppointmentItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'experimental' | 'regular'>('all');

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/appointments');
      if (res.ok) setItems(await res.json());
    };
    load();
    const i = setInterval(load, 15000);
    return () => clearInterval(i);
  }, []);

  const filtered = items.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'experimental') return a.type === 'EXPERIMENTAL';
    if (filter === 'regular') return a.type === 'REGULAR';
    return true;
  });

  // Agrupa por dia
  const byDay: Record<string, AppointmentItem[]> = {};
  filtered.forEach(a => {
    const day = new Date(a.scheduledAt).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(a);
  });

  return (
    <div className="animate-fade-up">
      <div className="px-10 pt-8 pb-6" style={{ borderBottom: '1px solid var(--border)' }}>
        <h1 className="font-display text-5xl tracking-tight leading-none mb-2 brand-glow">AGENDA</h1>
        <p style={{ color: 'var(--text-2)' }}>{filtered.length} aulas marcadas</p>
      </div>

      <div className="px-10 py-7">
        <div className="flex gap-2 mb-6">
          {[
            { k: 'all', l: 'Todas' },
            { k: 'experimental', l: '🎯 Experimentais' },
            { k: 'regular', l: '📚 Regulares' },
          ].map(f => (
            <button
              key={f.k}
              onClick={() => setFilter(f.k as 'all' | 'experimental' | 'regular')}
              className="px-4 py-2 rounded-lg text-sm transition-all"
              style={{
                background: filter === f.k ? 'var(--accent-soft)' : 'var(--surface)',
                color: filter === f.k ? 'var(--accent)' : 'var(--text-2)',
                border: `1px solid ${filter === f.k ? 'var(--accent)' : 'var(--border)'}`,
              }}
            >
              {f.l}
            </button>
          ))}
        </div>

        {Object.keys(byDay).length === 0 ? (
          <div className="text-center py-20" style={{ color: 'var(--text-3)' }}>
            <div className="text-4xl mb-3">📅</div>
            <p>Nenhuma aula marcada ainda.</p>
            <p className="text-xs mt-2">Aulas experimentais aparecem aqui automaticamente quando a Atena marca pelo WhatsApp.</p>
          </div>
        ) : (
          Object.entries(byDay).map(([day, dayItems]) => (
            <div key={day} className="mb-6">
              <h3 className="font-display text-lg mb-3 capitalize" style={{ color: 'var(--text-2)' }}>{day}</h3>
              <div className="grid grid-cols-2 gap-3">
                {dayItems.map(a => {
                  const time = new Date(a.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                  const modalityColor = a.modality === 'PILATES' ? 'var(--pilates)' : a.modality === 'MUSCULACAO' ? 'var(--musculacao)' : 'var(--crosstraining)';
                  const person = a.lead || a.student;
                  return (
                    <div
                      key={a.id}
                      className="rounded-xl p-4"
                      style={{
                        background: 'var(--surface)',
                        border: `1px solid ${a.type === 'EXPERIMENTAL' ? 'var(--warning)' : 'var(--border)'}`,
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-display text-2xl">{time}</div>
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: 'var(--bg-2)', color: modalityColor }}>
                          {a.modality}
                        </span>
                      </div>
                      <div className="text-sm font-medium">{person?.name || 'Sem nome'}</div>
                      <div className="text-xs font-mono mb-2" style={{ color: 'var(--text-3)' }}>{person?.phone}</div>
                      <div className="flex justify-between items-center text-[11px] pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                        <span style={{ color: 'var(--text-2)' }}>👨‍🏫 {a.teacher.name}</span>
                        {a.type === 'EXPERIMENTAL' && (
                          <span style={{ color: 'var(--warning)' }}>🎯 Experimental</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

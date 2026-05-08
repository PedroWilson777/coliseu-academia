'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';

interface Lead {
  id: string;
  name: string | null;
  phone: string;
  qualification: string;
  stage: string;
  interestedModality: string | null;
  interestedPlan: string | null;
  paymentMethod: string | null;
  experimentalDone: boolean;
  conversations: { id: string }[];
  updatedAt: string;
}

const STAGES = [
  { key: 'NEW',          label: 'Novos',         color: 'var(--text-2)',  emoji: '🌱' },
  { key: 'QUALIFIED',    label: 'Qualificados',  color: 'var(--ai)',       emoji: '🔵' },
  { key: 'EXPERIMENTAL', label: 'Experimental',  color: 'var(--warning)',  emoji: '🟡' },
  { key: 'CLOSING',      label: 'Fechamento',    color: 'var(--accent)',   emoji: '🔥' },
  { key: 'WON',          label: 'Ganhos',        color: 'var(--success)',  emoji: '✅' },
  { key: 'LOST',         label: 'Perdidos',      color: 'var(--text-3)',   emoji: '❌' },
];

export default function LeadsPage() {
  return <AppShell><Content /></AppShell>;
}

function Content() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/leads');
      if (res.ok) setLeads(await res.json());
    };
    load();
    const i = setInterval(load, 10000);
    return () => clearInterval(i);
  }, []);

  const byStage = (stage: string) => leads.filter(l => l.stage === stage);

  return (
    <div className="animate-fade-up">
      <div className="px-10 pt-8 pb-6" style={{ borderBottom: '1px solid var(--border)' }}>
        <h1 className="font-display text-5xl tracking-tight leading-none mb-2 brand-glow">FUNIL DE LEADS</h1>
        <p style={{ color: 'var(--text-2)' }}>{leads.length} {leads.length === 1 ? 'lead' : 'leads'} no total</p>
      </div>

      <div className="px-10 py-7 overflow-x-auto">
        <div className="flex gap-4 min-w-max pb-4">
          {STAGES.map(stage => {
            const stageLeads = byStage(stage.key);
            return (
              <div key={stage.key} className="w-[280px] flex-shrink-0">
                <div
                  className="rounded-t-xl px-4 py-3 flex justify-between items-center"
                  style={{ background: 'var(--surface)', borderTop: `2px solid ${stage.color}`, borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}
                >
                  <div className="flex items-center gap-2">
                    <span>{stage.emoji}</span>
                    <span className="font-display text-base">{stage.label}</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-2)', color: stage.color }}>
                    {stageLeads.length}
                  </span>
                </div>

                <div
                  className="rounded-b-xl p-2 min-h-[400px] max-h-[calc(100vh-220px)] overflow-y-auto space-y-2"
                  style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderTop: 'none' }}
                >
                  {stageLeads.length === 0 ? (
                    <div className="text-center py-8 text-xs" style={{ color: 'var(--text-4)' }}>Vazio</div>
                  ) : stageLeads.map(l => (
                    <button
                      key={l.id}
                      onClick={() => l.conversations[0] && router.push(`/chat?id=${l.conversations[0].id}`)}
                      className="w-full text-left rounded-lg p-3 transition-all hover:translate-y-[-1px]"
                      style={{ background: 'var(--surface)', border: `1px solid ${stage.key === 'CLOSING' ? 'var(--accent)' : 'var(--border)'}`, boxShadow: stage.key === 'CLOSING' ? '0 0 12px var(--accent-glow)' : 'none' }}
                    >
                      <div className="font-medium text-sm mb-1 truncate">{l.name || 'Sem nome'}</div>
                      <div className="text-[11px] font-mono mb-2" style={{ color: 'var(--text-3)' }}>{l.phone}</div>
                      {l.interestedModality && (
                        <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-2)' }}>
                          {l.interestedModality}
                        </div>
                      )}
                      {l.interestedPlan && (
                        <div className="text-xs" style={{ color: 'var(--text)' }}>{l.interestedPlan}</div>
                      )}
                      {l.paymentMethod && (
                        <div className="text-[11px] mt-1" style={{ color: stage.color }}>💳 {l.paymentMethod}</div>
                      )}
                      {l.experimentalDone && (
                        <div className="text-[11px] mt-1" style={{ color: 'var(--success)' }}>✅ Fez experimental</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

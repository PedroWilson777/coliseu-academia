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
  notes: string | null;
  conversations: { id: string }[];
  updatedAt: string;
}

export default function FechamentoPage() {
  return <AppShell><Content /></AppShell>;
}

function Content() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/leads?stage=CLOSING');
      if (res.ok) setLeads(await res.json());
    };
    load();
    const i = setInterval(load, 8000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="animate-fade-up">
      <div className="px-10 pt-8 pb-6" style={{ borderBottom: '1px solid var(--border)' }}>
        <h1 className="font-display text-5xl tracking-tight leading-none mb-2 brand-glow">
          🔥 FECHAMENTO
        </h1>
        <p style={{ color: 'var(--text-2)' }}>
          {leads.length === 0 ? 'Nenhum lead pronto pra fechar agora' : `${leads.length} lead${leads.length === 1 ? '' : 's'} pronto${leads.length === 1 ? '' : 's'} pra fechar a venda`}
        </p>
      </div>

      <div className="px-10 py-7 max-w-[900px]">
        {leads.length === 0 ? (
          <div className="text-center py-20" style={{ color: 'var(--text-3)' }}>
            <div className="w-16 h-16 rounded-full mx-auto mb-4 grid place-items-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              💤
            </div>
            <p>Aguardando leads chegarem na etapa de fechamento.</p>
            <p className="mt-2 text-xs">A Atena envia automaticamente quando o lead escolhe plano + forma de pagamento.</p>
          </div>
        ) : (
          leads.map(l => (
            <div
              key={l.id}
              className="rounded-xl p-5 mb-3 relative"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--accent)',
                boxShadow: '0 0 24px var(--accent-glow)',
              }}
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ background: 'var(--accent)', boxShadow: '0 0 16px var(--accent-glow)' }} />
              <div className="flex justify-between items-start gap-4 mb-3">
                <div>
                  <div className="font-display text-xl mb-1">🔥 {l.name || 'Sem nome'}</div>
                  <div className="text-xs font-mono" style={{ color: 'var(--text-3)' }}>{l.phone}</div>
                </div>
                <div className="flex gap-2">
                  {l.conversations[0] && (
                    <button
                      onClick={() => router.push(`/chat?id=${l.conversations[0].id}`)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{ background: 'var(--accent)', color: 'white' }}
                    >
                      Abrir conversa
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-3">
                <Stat label="Modalidade" value={l.interestedModality || '—'} />
                <Stat label="Plano" value={l.interestedPlan || '—'} />
                <Stat label="Pagamento" value={l.paymentMethod || '—'} />
              </div>

              {l.experimentalDone && (
                <div className="mt-3 text-xs" style={{ color: 'var(--success)' }}>
                  ✅ Já fez aula experimental
                </div>
              )}

              <div className="mt-3 text-[11px]" style={{ color: 'var(--text-3)' }}>
                Última atualização: {new Date(l.updatedAt).toLocaleString('pt-BR')}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg p-3" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
      <div className="text-[10px] uppercase tracking-[0.08em] mb-1" style={{ color: 'var(--text-3)' }}>{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import Link from 'next/link';

interface DashboardData {
  totalLeadsToday: number;
  closingLeads: number;
  waitingHuman: number;
  pendingNotifs: number;
  activeConvs: number;
  experimentsToday: number;
  totalStudents: number;
}

export default function Home() {
  return (
    <AppShell>
      <DashboardContent />
    </AppShell>
  );
}

function DashboardContent() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/dashboard');
      if (res.ok) setData(await res.json());
    };
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  })();

  const dateStr = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <div className="animate-fade-up">
      <div className="px-10 pt-8 pb-6 flex justify-between items-end gap-6" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="font-display text-5xl tracking-tight leading-none mb-2 brand-glow">
            {greeting.toUpperCase()}
          </h1>
          <p style={{ color: 'var(--text-2)' }}>
            {dateStr.charAt(0).toUpperCase() + dateStr.slice(1)} ·{' '}
            <span style={{ color: 'var(--accent)' }}>Coliseu Academia</span>
          </p>
        </div>
      </div>

      <div className="px-10 py-7">
        <div className="grid grid-cols-4 gap-4 mb-7">
          <KpiCard label="Leads hoje" value={data?.totalLeadsToday ?? '—'} hint="entradas" />
          <KpiCard
            label="No fechamento"
            value={data?.closingLeads ?? '—'}
            hint={data && data.closingLeads > 0 ? '🔥 prontos pra fechar!' : 'aguardando'}
            highlight={!!(data && data.closingLeads > 0)}
          />
          <KpiCard label="Aguardando você" value={data?.waitingHuman ?? '—'} hint="conversas" />
          <KpiCard label="Aulas experimentais hoje" value={data?.experimentsToday ?? '—'} hint="agendadas" />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-7">
          <KpiCard label="Conversas ativas" value={data?.activeConvs ?? '—'} hint="em andamento" />
          <KpiCard label="Total de alunos" value={data?.totalStudents ?? '—'} hint="cadastrados" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <QuickAction
            title="Caixa de Conversas"
            desc="Veja o que a Atena tá conversando agora"
            href="/chat"
            icon="💬"
          />
          <QuickAction
            title="Caixa de Fechamento"
            desc="Leads prontos pra você fechar a venda"
            href="/fechamento"
            icon="🔥"
            highlight={!!(data && data.closingLeads > 0)}
          />
          <QuickAction
            title="Agenda de Aulas"
            desc="Aulas experimentais e regulares"
            href="/agenda"
            icon="📅"
          />
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, hint, highlight }: { label: string; value: number | string; hint?: string; highlight?: boolean }) {
  return (
    <div
      className="p-5 rounded-xl transition-all hover:-translate-y-0.5"
      style={{
        background: 'var(--surface)',
        border: highlight ? '1px solid var(--accent)' : '1px solid var(--border)',
        boxShadow: highlight ? '0 0 24px var(--accent-glow)' : 'none',
      }}
    >
      <div className="text-[11px] uppercase tracking-[0.1em] mb-3" style={{ color: 'var(--text-3)' }}>
        {label}
      </div>
      <div className="font-display text-5xl leading-none tracking-tight" style={{ color: highlight ? 'var(--accent)' : 'var(--text)' }}>
        {value}
      </div>
      {hint && (
        <div className="mt-2 text-xs" style={{ color: highlight ? 'var(--accent)' : 'var(--text-2)' }}>
          {hint}
        </div>
      )}
    </div>
  );
}

function QuickAction({ title, desc, href, icon, highlight }: { title: string; desc: string; href: string; icon: string; highlight?: boolean }) {
  return (
    <Link
      href={href}
      className="block p-5 rounded-xl transition-all hover:-translate-y-0.5"
      style={{
        background: 'var(--surface)',
        border: highlight ? '1px solid var(--accent)' : '1px solid var(--border)',
        boxShadow: highlight ? '0 0 20px var(--accent-glow)' : 'none',
      }}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <h3 className="font-display text-lg mb-1">{title}</h3>
      <p className="text-xs" style={{ color: 'var(--text-2)' }}>{desc}</p>
    </Link>
  );
}

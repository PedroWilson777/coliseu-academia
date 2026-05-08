'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUser } from './Providers';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badgeKey?: 'closing' | 'pending' | 'experiments';
  adminOnly?: boolean;
}

const items: NavItem[] = [
  {
    href: '/',
    label: 'Painel',
    icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6Zm0-8a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5Zm11 0a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2V5Zm0 9a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2v-5Z"/></svg>,
  },
  {
    href: '/chat',
    label: 'Conversas',
    icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z"/></svg>,
    adminOnly: true,
  },
  {
    href: '/fechamento',
    label: 'Fechamento',
    icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>,
    badgeKey: 'closing',
    adminOnly: true,
  },
  {
    href: '/leads',
    label: 'Funil de Leads',
    icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 0 1 1-1h16a1 1 0 0 1 .8 1.6l-6.4 8.5V20l-4-2v-6.9L4.2 4.6A1 1 0 0 1 3 4z"/></svg>,
    adminOnly: true,
  },
  {
    href: '/agenda',
    label: 'Agenda',
    icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z"/></svg>,
    badgeKey: 'experiments',
  },
  {
    href: '/alunos',
    label: 'Alunos',
    icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 0 0-3-3.87m-4-12a4 4 0 0 1 0 7.75M9 20H4v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2H9zm3-12a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/></svg>,
    adminOnly: true,
  },
  {
    href: '/professores',
    label: 'Professores',
    icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 0 1 .665 6.479A11.952 11.952 0 0 0 12 20.055a11.952 11.952 0 0 0-6.824-2.998 12.078 12.078 0 0 1 .665-6.479L12 14z"/></svg>,
    adminOnly: true,
  },
  {
    href: '/supervisor',
    label: 'Supervisor',
    icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 0 0-12 0v3.2c0 .53-.21 1.04-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0m6 0H9"/></svg>,
    badgeKey: 'pending',
    adminOnly: true,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useUser();
  const [counts, setCounts] = useState({ closing: 0, pending: 0, experiments: 0 });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await fetch('/api/dashboard');
        if (res.ok) {
          const data = await res.json();
          setCounts({
            closing: data.closingLeads || 0,
            pending: data.pendingNotifs || 0,
            experiments: data.experimentsToday || 0,
          });
        }
      } catch {}
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 15000);
    return () => clearInterval(interval);
  }, []);

  const isAdmin = user?.role === 'ADMIN';
  const visibleItems = items.filter(i => !i.adminOnly || isAdmin);

  return (
    <aside
      className="flex flex-col p-6 pt-7 pb-5 relative h-screen"
      style={{ background: 'var(--bg-2)', borderRight: '1px solid var(--border)', width: 260 }}
    >
      <div className="pb-6 mb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-full grid place-items-center font-display text-2xl"
            style={{
              background: 'linear-gradient(135deg, var(--accent), #8b1820)',
              color: 'white',
              boxShadow: '0 0 0 1px var(--accent), 0 0 16px var(--accent-glow)',
            }}
          >
            C
          </div>
          <div>
            <h1 className="font-display text-2xl leading-none brand-glow" style={{ letterSpacing: '0.05em' }}>
              COLISEU
            </h1>
            <small className="text-[10px] tracking-[0.15em] uppercase" style={{ color: 'var(--text-3)' }}>
              Academia
            </small>
          </div>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-0.5">
        <div className="text-[10px] tracking-[0.14em] uppercase px-3 pt-2 pb-2" style={{ color: 'var(--text-4)' }}>
          {isAdmin ? 'Operação' : 'Meu painel'}
        </div>

        {visibleItems.map(item => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const badgeValue = item.badgeKey ? counts[item.badgeKey] : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative"
              style={{
                background: active ? 'linear-gradient(90deg, var(--accent-soft), transparent 60%)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text-2)',
                fontWeight: active ? 500 : 400,
              }}
            >
              {active && (
                <div className="absolute -left-6 top-2 bottom-2 w-[3px] rounded-r" style={{ background: 'var(--accent)', boxShadow: '0 0 12px var(--accent-glow)' }} />
              )}
              {item.icon}
              <span className="flex-1 text-sm">{item.label}</span>
              {badgeValue > 0 && (
                <span
                  className="text-[11px] px-1.5 py-0.5 rounded-[10px] font-semibold animate-pulse-soft"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                >
                  {badgeValue}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {isAdmin && (
        <div
          className="mt-4 p-3 rounded-xl relative overflow-hidden"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 100% 0%, var(--accent-soft), transparent 50%)' }} />
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.1em] mb-1" style={{ color: 'var(--text-3)' }}>
            <div className="w-2 h-2 rounded-full animate-pulse-soft" style={{ background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }} />
            Atena · Online
          </div>
          <h3 className="font-display text-base leading-none mb-1">IA Atendendo</h3>
          <p className="text-xs" style={{ color: 'var(--text-2)' }}>
            {counts.closing > 0
              ? `${counts.closing} no fechamento`
              : 'Tudo sob controle'}
          </p>
        </div>
      )}

      <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="w-8 h-8 rounded-full grid place-items-center font-bold text-xs" style={{
            background: 'linear-gradient(135deg, var(--accent), #8b1820)',
            color: 'white',
          }}>
            {(user?.name || user?.email || '?')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">{user?.name || user?.email || 'Usuário'}</div>
            <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
              {isAdmin ? '👑 Admin' : user?.role === 'TEACHER' ? '🏋️ Professor' : 'Pendente'}
            </div>
          </div>
          <button
            onClick={signOut}
            className="p-1.5 rounded-lg hover:bg-[var(--surface)]"
            title="Sair"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1"/></svg>
          </button>
        </div>
      </div>
    </aside>
  );
}

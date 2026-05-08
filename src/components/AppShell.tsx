'use client';

import { useUser } from './Providers';
import { Sidebar } from './Sidebar';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="h-screen grid place-items-center" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full mx-auto mb-3 animate-pulse-soft" style={{ background: 'var(--accent)' }} />
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (user.role === 'PENDING') {
    return (
      <div className="h-screen grid place-items-center p-6" style={{ background: 'var(--bg)' }}>
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 grid place-items-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>
          </div>
          <h2 className="font-display text-2xl mb-2">Acesso pendente</h2>
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>
            Tua conta foi reconhecida, mas ainda não tem permissão. Pede pra um admin liberar.
          </p>
          <p className="mt-4 text-xs font-mono" style={{ color: 'var(--text-3)' }}>
            {user.email}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-screen" style={{ gridTemplateColumns: '260px 1fr' }}>
      <Sidebar />
      <main className="overflow-y-auto overflow-x-hidden relative">{children}</main>
    </div>
  );
}

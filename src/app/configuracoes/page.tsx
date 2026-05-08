'use client';

import { AppShell } from '@/components/AppShell';

export default function ConfigPage() {
  return (
    <AppShell>
      <div className="animate-fade-up">
        <div className="px-10 pt-8 pb-6" style={{ borderBottom: '1px solid var(--border)' }}>
          <h1 className="font-display text-5xl tracking-tight leading-none mb-2 brand-glow">CONFIGURAÇÕES</h1>
          <p style={{ color: 'var(--text-2)' }}>Ajustes da academia</p>
        </div>

        <div className="px-10 py-7 max-w-[700px]">
          <div className="rounded-xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h3 className="font-display text-xl mb-4">📌 Em breve</h3>
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Em breve você poderá ajustar:
            </p>
            <ul className="mt-3 space-y-2 text-sm" style={{ color: 'var(--text-2)' }}>
              <li>• Capacidade das modalidades</li>
              <li>• Horário de funcionamento</li>
              <li>• Editar planos e preços</li>
              <li>• Pausar/ativar a Atena</li>
            </ul>
            <p className="mt-4 text-xs" style={{ color: 'var(--text-3)' }}>
              Por enquanto essas configurações estão no banco. Me avisa se precisar mudar algo!
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

import { Suspense } from 'react';
import ChatClient from './ChatClient';

export const dynamic = 'force-dynamic';

export default function ChatPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ChatClient />
    </Suspense>
  );
}

function Loading() {
  return (
    <div className="grid place-items-center h-screen" style={{ background: 'var(--bg)' }}>
      <div className="text-center" style={{ color: 'var(--text-3)' }}>
        <div className="w-12 h-12 rounded-full mx-auto mb-4 animate-pulse-soft" style={{ background: 'var(--accent)' }} />
        <p className="text-sm">Carregando conversas...</p>
      </div>
    </div>
  );
}

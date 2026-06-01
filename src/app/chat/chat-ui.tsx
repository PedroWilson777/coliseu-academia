// Componentes de UI reutilizáveis do Chat
import type { MessageItem } from './chat-types';

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, { l: string; bg: string; c: string }> = {
    AI_ACTIVE:     { l: 'Atena respondendo', bg: 'var(--ai-glow)', c: 'var(--ai)' },
    HUMAN_ACTIVE:  { l: 'Você atendendo',    bg: 'rgba(240,160,32,0.15)', c: 'var(--human)' },
    WAITING_HUMAN: { l: 'Aguardando você',   bg: 'rgba(251,191,36,0.15)', c: 'var(--warning)' },
    RESOLVED:      { l: 'Resolvida',          bg: 'rgba(74,222,128,0.12)', c: 'var(--success)' },
  };
  const s = map[status] || map.AI_ACTIVE;
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-2xl text-[11px] font-medium uppercase tracking-[0.08em]" style={{ background: s.bg, color: s.c }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.c }} />
      {s.l}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { l: string; bg: string; c: string }> = {
    AI_ACTIVE:     { l: 'IA',      bg: 'var(--ai-glow)', c: 'var(--ai)' },
    HUMAN_ACTIVE:  { l: 'Humano',  bg: 'rgba(240,160,32,0.15)', c: 'var(--human)' },
    WAITING_HUMAN: { l: 'Aguarda', bg: 'rgba(251,191,36,0.15)', c: 'var(--warning)' },
    RESOLVED:      { l: 'OK',      bg: 'rgba(74,222,128,0.12)', c: 'var(--success)' },
  };
  const s = map[status] || map.AI_ACTIVE;
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded uppercase tracking-[0.08em] font-medium" style={{ background: s.bg, color: s.c }}>
      {s.l}
    </span>
  );
}

export function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded uppercase tracking-[0.08em] font-medium" style={{ background: 'var(--accent-soft)', color }}>
      {label}
    </span>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-4" style={{ borderTop: '1px solid var(--border)' }}>
      <h4 className="text-[11px] uppercase tracking-[0.1em] mb-2.5 font-medium" style={{ color: 'var(--text-3)' }}>{title}</h4>
      {children}
    </div>
  );
}

export function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-1.5 text-[13px]">
      <span style={{ color: 'var(--text-2)' }}>{label}</span>
      <span className="font-medium" style={{ color: 'var(--text)' }}>{value}</span>
    </div>
  );
}

export function Avatar({ name, large, student }: { name: string; large?: boolean; student?: boolean }) {
  const initials = (name || '?').split(' ').slice(0, 2).map(s => s[0]).join('').toUpperCase();
  const size = large ? 'w-16 h-16 text-2xl' : 'w-9 h-9 text-sm';
  const bg = student
    ? 'linear-gradient(135deg, #4ade80, #16a34a)'
    : 'linear-gradient(135deg, var(--accent), #8b1820)';
  return (
    <div className={`${size} rounded-full grid place-items-center font-bold flex-shrink-0 ${large ? 'font-display' : ''}`} style={{ background: bg, color: 'white' }}>
      {initials}
    </div>
  );
}

export function formatTime(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return 'agora';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function MessageBubble({ m }: { m: MessageItem }) {
  const time = new Date(m.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  if (m.sender === 'CLIENT') {
    return (
      <div className="mb-3 flex max-w-[70%] animate-msg-in">
        <div>
          {m.isAudio ? (
            <div className="rounded-2xl rounded-bl overflow-hidden" style={{ background: 'var(--surface-2)' }}>
              {m.audioBase64 && (
                <div className="px-3 pt-2.5">
                  <audio controls src={m.audioBase64} className="w-full h-8" style={{ minWidth: 200 }} />
                </div>
              )}
              {m.audioTranscript && (
                <div className="px-3.5 py-2 text-sm italic" style={{ color: 'var(--text-2)' }}>
                  <span className="text-[10px] not-italic font-medium mr-1" style={{ color: 'var(--text-3)' }}>🎤</span>
                  {m.audioTranscript}
                </div>
              )}
              <div className="px-3 pb-1.5 text-[10px] text-right" style={{ color: 'var(--text-3)' }}>{time}</div>
            </div>
          ) : (
            <div className="rounded-2xl rounded-bl px-3.5 py-2.5 text-sm" style={{ background: 'var(--surface-2)' }}>
              {m.content}
              <div className="text-[10px] text-right mt-1" style={{ color: 'var(--text-3)' }}>{time}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (m.sender === 'AI') {
    return (
      <div className="mb-3 flex justify-end animate-msg-in">
        <div className="max-w-[70%]">
          <div className="rounded-2xl rounded-br px-3.5 py-2.5 text-sm" style={{ background: 'var(--ai-bubble)', color: 'var(--text)' }}>
            {m.content}
            <div className="text-[10px] text-right mt-1 flex justify-end items-center gap-1" style={{ color: 'var(--ai)' }}>
              <span>Atena</span>
              <span>· {time}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // HUMAN
  return (
    <div className="mb-3 flex justify-end animate-msg-in">
      <div className="max-w-[70%]">
        <div className="rounded-2xl rounded-br px-3.5 py-2.5 text-sm" style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)', color: 'var(--text)' }}>
          {m.content}
          <div className="text-[10px] text-right mt-1 flex justify-end items-center gap-1" style={{ color: 'var(--accent)' }}>
            <span>{m.authorName || 'Você'}</span>
            <span>· {time}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

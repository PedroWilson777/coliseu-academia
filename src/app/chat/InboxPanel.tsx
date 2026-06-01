// Painel esquerdo: lista de conversas + filtros
import type { ConvListItem } from './chat-types';
import { Avatar, StatusBadge, Badge, formatTime } from './chat-ui';

const FILTERS = [
  { k: 'all',      l: 'Todas' },
  { k: 'leads',    l: 'Leads' },
  { k: 'students', l: 'Alunos' },
  { k: 'closing',  l: '🔥' },
  { k: 'waiting',  l: 'Esperando' },
];

interface InboxPanelProps {
  conversations: ConvListItem[];
  filter: string;
  selectedId: string | null;
  onFilterChange: (f: string) => void;
  onSelectConversation: (id: string) => void;
}

export function InboxPanel({ conversations, filter, selectedId, onFilterChange, onSelectConversation }: InboxPanelProps) {
  return (
    <div className="flex flex-col overflow-hidden" style={{ background: 'var(--bg-2)', borderRight: '1px solid var(--border)' }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <h2 className="font-display text-2xl tracking-tight">CONVERSAS</h2>
        <small style={{ color: 'var(--text-3)' }}>{conversations.length} total</small>
      </div>

      {/* Filtros */}
      <div className="flex gap-1 p-3 overflow-x-auto">
        {FILTERS.map(f => (
          <button
            key={f.k}
            onClick={() => onFilterChange(f.k)}
            className="px-3 py-1 rounded-2xl text-[11px] whitespace-nowrap transition-all"
            style={{
              background: filter === f.k ? 'var(--accent-soft)' : 'transparent',
              color: filter === f.k ? 'var(--accent)' : 'var(--text-2)',
              border: `1px solid ${filter === f.k ? 'var(--accent)' : 'var(--border)'}`,
            }}
          >
            {f.l}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm" style={{ color: 'var(--text-3)' }}>
            Nenhuma conversa.<br />Mande &quot;oi&quot; pro WhatsApp pra testar.
          </div>
        ) : conversations.map(c => (
          <button
            key={c.id}
            onClick={() => onSelectConversation(c.id)}
            className="w-full text-left grid gap-3 px-5 py-3 transition-colors relative"
            style={{
              gridTemplateColumns: '40px 1fr',
              background: selectedId === c.id ? 'var(--surface-2)' : 'transparent',
              borderBottom: '1px solid var(--border)',
            }}
          >
            {selectedId === c.id && (
              <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: 'var(--accent)' }} />
            )}
            <Avatar name={c.name} student={c.type === 'STUDENT'} />
            <div className="min-w-0">
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-sm font-medium truncate flex items-center gap-1.5">
                  {c.type === 'STUDENT' && <span style={{ color: 'var(--success)', fontSize: 10 }}>● ALUNO</span>}
                  {c.name}
                </span>
                <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-3)' }}>
                  {formatTime(c.lastMessageAt)}
                </span>
              </div>
              <div className="text-xs truncate mb-1" style={{ color: c.unreadCount > 0 ? 'var(--text)' : 'var(--text-2)' }}>
                {c.isAudio ? '🎤 ' : ''}{c.lastMessage || '—'}
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <StatusBadge status={c.status} />
                {c.stage === 'CLOSING' && <Badge label="🔥 Fechar" color="var(--accent)" />}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

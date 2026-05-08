'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';

interface ConvListItem {
  id: string;
  type: 'STUDENT' | 'LEAD';
  name: string;
  phone: string;
  status: string;
  qualification?: string;
  stage?: string;
  unreadCount: number;
  lastMessage: string;
  lastMessageAt: string;
  isAudio: boolean;
}

interface MessageItem {
  id: string;
  sender: 'CLIENT' | 'AI' | 'HUMAN';
  content: string;
  authorName?: string;
  createdAt: string;
  isAudio: boolean;
  audioTranscript?: string;
}

interface ConvDetail {
  id: string;
  status: string;
  type: 'STUDENT' | 'LEAD';
  person: {
    id: string;
    name?: string;
    phone: string;
    qualification?: string;
    stage?: string;
    notes?: string;
    interestedModality?: string;
    interestedPlan?: string;
    paymentMethod?: string;
    experimentalDone?: boolean;
    modality?: string;
    plan?: string;
    paymentDay?: number;
  };
  messages: MessageItem[];
}

export default function ChatClient() {
  return (
    <AppShell>
      <ChatContent />
    </AppShell>
  );
}

function ChatContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedId = searchParams.get('id');

  const [conversations, setConversations] = useState<ConvListItem[]>([]);
  const [activeConv, setActiveConv] = useState<ConvDetail | null>(null);
  const [filter, setFilter] = useState('all');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadInbox = useCallback(async () => {
    const res = await fetch('/api/conversations');
    if (res.ok) setConversations(await res.json());
  }, []);

  const loadConv = useCallback(async (id: string) => {
    const res = await fetch(`/api/conversations/${id}`);
    if (res.ok) setActiveConv(await res.json());
  }, []);

  useEffect(() => {
    loadInbox();
    const i = setInterval(loadInbox, 5000);
    return () => clearInterval(i);
  }, [loadInbox]);

  useEffect(() => {
    if (selectedId) {
      loadConv(selectedId);
      const i = setInterval(() => loadConv(selectedId), 3000);
      return () => clearInterval(i);
    } else {
      setActiveConv(null);
    }
  }, [selectedId, loadConv]);

  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages.length]);

  const filtered = conversations.filter(c => {
    if (filter === 'all') return true;
    if (filter === 'students') return c.type === 'STUDENT';
    if (filter === 'leads') return c.type === 'LEAD';
    if (filter === 'closing') return c.stage === 'CLOSING';
    if (filter === 'waiting') return c.status === 'WAITING_HUMAN';
    return true;
  });

  const handlePause = async () => {
    if (!activeConv) return;
    await fetch(`/api/conversations/${activeConv.id}/pause`, { method: 'POST' });
    loadConv(activeConv.id);
    loadInbox();
  };

  const handleResume = async () => {
    if (!activeConv) return;
    await fetch(`/api/conversations/${activeConv.id}/resume`, { method: 'POST' });
    loadConv(activeConv.id);
    loadInbox();
  };

  const handleSend = async () => {
    if (!input.trim() || !activeConv || sending) return;
    setSending(true);
    try {
      await fetch(`/api/conversations/${activeConv.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input.trim() }),
      });
      setInput('');
      await loadConv(activeConv.id);
      await loadInbox();
    } finally {
      setSending(false);
    }
  };

  const isPaused = activeConv?.status === 'HUMAN_ACTIVE' || activeConv?.status === 'WAITING_HUMAN';

  return (
    <div className="grid h-screen" style={{ gridTemplateColumns: '320px 1fr 300px', background: 'var(--bg)' }}>
      {/* INBOX */}
      <div className="flex flex-col overflow-hidden" style={{ background: 'var(--bg-2)', borderRight: '1px solid var(--border)' }}>
        <div className="px-5 pt-5 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-display text-2xl tracking-tight">CONVERSAS</h2>
          <small style={{ color: 'var(--text-3)' }}>{filtered.length} total</small>
        </div>

        <div className="flex gap-1 p-3 overflow-x-auto">
          {[
            { k: 'all', l: 'Todas' },
            { k: 'leads', l: 'Leads' },
            { k: 'students', l: 'Alunos' },
            { k: 'closing', l: '🔥' },
            { k: 'waiting', l: 'Esperando' },
          ].map(f => (
            <button
              key={f.k}
              onClick={() => setFilter(f.k)}
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

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm" style={{ color: 'var(--text-3)' }}>
              Nenhuma conversa.<br/>Mande &quot;oi&quot; pro WhatsApp pra testar.
            </div>
          ) : filtered.map(c => (
            <button
              key={c.id}
              onClick={() => router.push(`/chat?id=${c.id}`)}
              className="w-full text-left grid gap-3 px-5 py-3 transition-colors relative"
              style={{
                gridTemplateColumns: '40px 1fr',
                background: selectedId === c.id ? 'var(--surface-2)' : 'transparent',
                borderBottom: '1px solid var(--border)',
              }}
            >
              {selectedId === c.id && <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: 'var(--accent)' }} />}
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

      {/* CONVERSATION */}
      <div className="flex flex-col overflow-hidden">
        {!activeConv ? (
          <div className="grid place-items-center h-full text-center" style={{ color: 'var(--text-3)' }}>
            <div>
              <div className="w-16 h-16 rounded-full grid place-items-center mx-auto mb-4" style={{ background: 'var(--surface)', color: 'var(--accent)' }}>
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
              </div>
              <h3 className="font-display text-2xl mb-1" style={{ color: 'var(--text)' }}>Selecione uma conversa</h3>
              <small>Atena atende sozinha. Você assume quando precisar.</small>
            </div>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 flex justify-between items-center" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-2)' }}>
              <div className="flex items-center gap-3">
                <Avatar name={activeConv.person.name || activeConv.person.phone} student={activeConv.type === 'STUDENT'} />
                <div>
                  <h3 className="font-semibold text-base flex items-center gap-2">
                    {activeConv.person.name || 'Sem nome'}
                    {activeConv.type === 'STUDENT' && <span className="text-[10px] px-1.5 py-0.5 rounded uppercase tracking-[0.08em]" style={{ background: 'rgba(74,222,128,0.15)', color: 'var(--success)' }}>Aluno</span>}
                  </h3>
                  <small className="text-[11px]" style={{ color: 'var(--text-3)' }}>{activeConv.person.phone}</small>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <StatusPill status={activeConv.status} />
                {isPaused ? (
                  <button onClick={handleResume} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                    Devolver pra Atena
                  </button>
                ) : (
                  <button onClick={handlePause} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)', color: 'var(--accent)' }}>
                    Pausar IA · Assumir
                  </button>
                )}
              </div>
            </div>

            {isPaused && (
              <div className="px-6 py-2 text-xs" style={{ background: 'rgba(240,160,32,0.15)', borderBottom: '1px solid rgba(240,160,32,0.3)', color: 'var(--human)' }}>
                ⏸ Atena pausada. Tudo que digitar vai direto pro cliente.
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {activeConv.messages.map(m => <MessageBubble key={m.id} m={m} />)}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ background: 'var(--bg-2)', borderTop: '1px solid var(--border)' }}>
              <div className="px-6 py-4 flex gap-2.5 items-end">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                  placeholder={isPaused ? 'Sua mensagem vai direto pro cliente...' : 'Pause a Atena pra responder.'}
                  disabled={!isPaused || sending}
                  className="flex-1 rounded-xl px-3 py-2.5 text-sm resize-none"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', minHeight: 40, maxHeight: 120, outline: 'none' }}
                />
                <button
                  onClick={handleSend}
                  disabled={!isPaused || sending || !input.trim()}
                  className="w-10 h-10 rounded-xl grid place-items-center"
                  style={{
                    background: isPaused && input.trim() ? 'var(--accent)' : 'var(--surface-2)',
                    color: isPaused && input.trim() ? 'white' : 'var(--text-3)',
                    cursor: isPaused && input.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12l14-7-7 14-2-5-5-2z"/></svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* LEAD PANEL */}
      <div className="overflow-y-auto p-5" style={{ background: 'var(--bg-2)', borderLeft: '1px solid var(--border)' }}>
        {!activeConv ? (
          <div className="text-center text-sm py-10" style={{ color: 'var(--text-3)' }}>
            Selecione uma conversa
          </div>
        ) : (
          <>
            <div className="text-center mb-4">
              <div className="mx-auto mb-3"><Avatar name={activeConv.person.name || activeConv.person.phone} large student={activeConv.type === 'STUDENT'} /></div>
              <div className="font-display text-xl">{activeConv.person.name || 'Sem nome'}</div>
              <div className="text-xs font-mono mt-1" style={{ color: 'var(--text-3)' }}>{activeConv.person.phone}</div>
            </div>

            {activeConv.type === 'LEAD' ? (
              <>
                <Section title="Estágio do Lead">
                  <Row label="Status" value={activeConv.person.stage || 'NEW'} />
                  <Row label="Qualificação" value={activeConv.person.qualification || 'UNKNOWN'} />
                  {activeConv.person.experimentalDone && (
                    <Row label="Aula experimental" value="✅ feita" />
                  )}
                </Section>
                <Section title="Interesse">
                  <Row label="Modalidade" value={activeConv.person.interestedModality || '—'} />
                  <Row label="Plano" value={activeConv.person.interestedPlan || '—'} />
                  <Row label="Pagamento" value={activeConv.person.paymentMethod || '—'} />
                </Section>
              </>
            ) : (
              <>
                <Section title="Aluno">
                  <Row label="Modalidade" value={activeConv.person.modality || '—'} />
                  <Row label="Plano" value={activeConv.person.plan || '—'} />
                  <Row label="Vencimento dia" value={activeConv.person.paymentDay?.toString() || '—'} />
                </Section>
              </>
            )}

            {activeConv.person.notes && (
              <Section title="Anotações">
                <div className="rounded-lg p-3 text-xs italic" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
                  &quot;{activeConv.person.notes}&quot;
                </div>
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ m }: { m: MessageItem }) {
  const time = new Date(m.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  if (m.sender === 'CLIENT') {
    return (
      <div className="mb-3 flex max-w-[70%] animate-msg-in">
        <div>
          {m.isAudio && m.audioTranscript && (
            <div className="text-[11px] mb-1 italic flex items-center gap-1" style={{ color: 'var(--text-3)' }}>
              🎤 transcrito de áudio
            </div>
          )}
          <div className="px-3.5 py-2.5 rounded-2xl rounded-bl text-sm" style={{ background: 'var(--surface-2)', color: 'var(--text)' }}>
            {m.content}
          </div>
          <div className="text-[10px] mt-1 uppercase" style={{ color: 'var(--text-3)' }}>{time}</div>
        </div>
      </div>
    );
  }

  if (m.sender === 'AI') {
    return (
      <div className="mb-3 flex flex-row-reverse max-w-[70%] ml-auto animate-msg-in">
        <div>
          <div className="px-3.5 py-2.5 rounded-2xl rounded-br text-sm" style={{
            background: 'linear-gradient(135deg, rgba(91,141,239,0.18), rgba(91,141,239,0.08))',
            border: '1px solid rgba(91,141,239,0.25)',
            color: 'var(--text)',
          }}>
            {m.content}
          </div>
          <div className="text-[10px] mt-1 uppercase text-right" style={{ color: 'var(--text-3)' }}>
            <span className="font-semibold" style={{ color: 'var(--ai)' }}>Atena</span> · {time}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-3 flex flex-row-reverse max-w-[70%] ml-auto animate-msg-in">
      <div>
        <div className="px-3.5 py-2.5 rounded-2xl rounded-br text-sm font-medium" style={{
          background: 'linear-gradient(135deg, var(--accent), #8b1820)',
          color: 'white',
        }}>
          {m.content}
        </div>
        <div className="text-[10px] mt-1 uppercase text-right" style={{ color: 'var(--text-3)' }}>
          <span className="font-semibold" style={{ color: 'var(--accent)' }}>{m.authorName || 'Você'}</span> · {time}
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { l: string; bg: string; c: string }> = {
    AI_ACTIVE: { l: 'Atena respondendo', bg: 'var(--ai-glow)', c: 'var(--ai)' },
    HUMAN_ACTIVE: { l: 'Você atendendo', bg: 'rgba(240,160,32,0.15)', c: 'var(--human)' },
    WAITING_HUMAN: { l: 'Aguardando você', bg: 'rgba(251,191,36,0.15)', c: 'var(--warning)' },
    RESOLVED: { l: 'Resolvida', bg: 'rgba(74,222,128,0.12)', c: 'var(--success)' },
  };
  const s = map[status] || map.AI_ACTIVE;
  return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-2xl text-[11px] font-medium uppercase tracking-[0.08em]" style={{ background: s.bg, color: s.c }}><span className="w-1.5 h-1.5 rounded-full" style={{ background: s.c }} />{s.l}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { l: string; bg: string; c: string }> = {
    AI_ACTIVE: { l: 'IA', bg: 'var(--ai-glow)', c: 'var(--ai)' },
    HUMAN_ACTIVE: { l: 'Humano', bg: 'rgba(240,160,32,0.15)', c: 'var(--human)' },
    WAITING_HUMAN: { l: 'Aguarda', bg: 'rgba(251,191,36,0.15)', c: 'var(--warning)' },
    RESOLVED: { l: 'OK', bg: 'rgba(74,222,128,0.12)', c: 'var(--success)' },
  };
  const s = map[status] || map.AI_ACTIVE;
  return <span className="text-[10px] px-1.5 py-0.5 rounded uppercase tracking-[0.08em] font-medium" style={{ background: s.bg, color: s.c }}>{s.l}</span>;
}

function Badge({ label, color }: { label: string; color: string }) {
  return <span className="text-[10px] px-1.5 py-0.5 rounded uppercase tracking-[0.08em] font-medium" style={{ background: 'var(--accent-soft)', color }}>{label}</span>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-4" style={{ borderTop: '1px solid var(--border)' }}>
      <h4 className="text-[11px] uppercase tracking-[0.1em] mb-2.5 font-medium" style={{ color: 'var(--text-3)' }}>{title}</h4>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-1.5 text-[13px]">
      <span style={{ color: 'var(--text-2)' }}>{label}</span>
      <span className="font-medium" style={{ color: 'var(--text)' }}>{value}</span>
    </div>
  );
}

function Avatar({ name, large, student }: { name: string; large?: boolean; student?: boolean }) {
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

function formatTime(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return 'agora';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

'use client';

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import type { ConvListItem, ConvDetail } from './chat-types';
import { InboxPanel } from './InboxPanel';
import { MessageThread } from './MessageThread';
import { LeadPanel } from './LeadPanel';

export default function ChatClient() {
  return (
    <AppShell>
      <Suspense fallback={<ChatSkeleton />}>
        <ChatContent />
      </Suspense>
    </AppShell>
  );
}

function ChatSkeleton() {
  return (
    <div className="grid h-screen" style={{ gridTemplateColumns: '320px 1fr 300px', background: 'var(--bg)' }}>
      <div style={{ background: 'var(--bg-2)', borderRight: '1px solid var(--border)' }} />
      <div className="grid place-items-center" style={{ color: 'var(--text-3)' }}>
        <div className="w-8 h-8 rounded-full animate-pulse" style={{ background: 'var(--accent-soft)' }} />
      </div>
      <div style={{ background: 'var(--bg-2)', borderLeft: '1px solid var(--border)' }} />
    </div>
  );
}

function ChatContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedId = searchParams.get('id');

  // ── Estado ──────────────────────────────────────────────
  const [conversations, setConversations] = useState<ConvListItem[]>([]);
  const [activeConv, setActiveConv] = useState<ConvDetail | null>(null);
  const [filter, setFilter] = useState('all');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [gravando, setGravando] = useState(false);
  const [enviandoAudio, setEnviandoAudio] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);

  // ── Carregamento de dados ────────────────────────────────
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
    const interval = setInterval(loadInbox, 5000);
    return () => clearInterval(interval);
  }, [loadInbox]);

  useEffect(() => {
    if (selectedId) {
      loadConv(selectedId);
      const interval = setInterval(() => loadConv(selectedId), 3000);
      return () => clearInterval(interval);
    } else {
      setActiveConv(null);
    }
  }, [selectedId, loadConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages.length]);

  // ── Filtros ──────────────────────────────────────────────
  const filtered = conversations.filter(c => {
    if (filter === 'all') return true;
    if (filter === 'students') return c.type === 'STUDENT';
    if (filter === 'leads') return c.type === 'LEAD';
    if (filter === 'closing') return c.stage === 'CLOSING';
    if (filter === 'waiting') return c.status === 'WAITING_HUMAN';
    return true;
  });

  const isPaused = activeConv?.status === 'HUMAN_ACTIVE' || activeConv?.status === 'WAITING_HUMAN';

  // ── Handlers de conversa ─────────────────────────────────
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

  const handleDelete = async () => {
    if (!activeConv) return;
    const name = activeConv.person.name || activeConv.person.phone;
    if (!confirm(`Apagar conversa com ${name}?\n\nIsso remove a conversa, todas as mensagens e o lead. Útil pra reiniciar testes.`)) return;
    await fetch(`/api/conversations/${activeConv.id}`, { method: 'DELETE' });
    router.push('/chat');
    await loadInbox();
  };

  // ── Handlers de mensagem ─────────────────────────────────
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

  // ── Handlers de áudio ────────────────────────────────────
  const iniciarGravacao = async () => {
    if (!isPaused || gravando || enviandoAudio) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];
        audioStreamRef.current?.getTracks().forEach(t => t.stop());
        await enviarAudio(blob, mimeType);
      };

      recorder.start();
      setGravando(true);
    } catch {
      alert('Permita o acesso ao microfone para enviar áudios.');
    }
  };

  const pararGravacao = () => {
    if (mediaRecorderRef.current && gravando) {
      mediaRecorderRef.current.stop();
      setGravando(false);
    }
  };

  const enviarAudio = async (blob: Blob, mimeType: string) => {
    if (!activeConv) return;
    setEnviandoAudio(true);
    try {
      const ext = mimeType.includes('ogg') ? 'ogg' : 'webm';
      const formData = new FormData();
      formData.append('audio', blob, `audio.${ext}`);
      await fetch(`/api/conversations/${activeConv.id}/audio`, { method: 'POST', body: formData });
      await loadConv(activeConv.id);
      await loadInbox();
    } finally {
      setEnviandoAudio(false);
    }
  };

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="grid h-screen" style={{ gridTemplateColumns: '320px 1fr 300px', background: 'var(--bg)' }}>
      <InboxPanel
        conversations={filtered}
        filter={filter}
        selectedId={selectedId}
        onFilterChange={setFilter}
        onSelectConversation={(id) => router.push(`/chat?id=${id}`)}
      />
      <MessageThread
        conv={activeConv}
        isPaused={isPaused}
        input={input}
        sending={sending}
        gravando={gravando}
        enviandoAudio={enviandoAudio}
        messagesEndRef={messagesEndRef}
        onInputChange={setInput}
        onSend={handleSend}
        onPause={handlePause}
        onResume={handleResume}
        onDelete={handleDelete}
        onStartRecording={iniciarGravacao}
        onStopRecording={pararGravacao}
      />
      <LeadPanel conv={activeConv} />
    </div>
  );
}

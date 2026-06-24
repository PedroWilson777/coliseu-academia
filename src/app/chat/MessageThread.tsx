// Painel central: cabeçalho da conversa + mensagens + input de texto/áudio
import { useRef, useState } from 'react';
import type { ConvDetail } from './chat-types';
import { Avatar, StatusPill, MessageBubble } from './chat-ui';

interface MessageThreadProps {
  conv: ConvDetail | null;
  isPaused: boolean;
  input: string;
  sending: boolean;
  sendError: string | null;
  gravando: boolean;
  enviandoAudio: boolean;
  enviandoMidia: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onInputChange: (v: string) => void;
  onSend: () => void;
  onPause: () => void;
  onResume: () => void;
  onDelete: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onSendMedia: (file: File, caption: string) => Promise<void>;
}

export function MessageThread({
  conv, isPaused, input, sending, sendError, gravando, enviandoAudio, enviandoMidia,
  messagesEndRef, onInputChange, onSend, onPause, onResume, onDelete,
  onStartRecording, onStopRecording, onSendMedia,
}: MessageThreadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaCaption, setMediaCaption] = useState('');

  if (!conv) {
    return (
      <div className="flex flex-col overflow-hidden">
        <div className="grid place-items-center h-full text-center" style={{ color: 'var(--text-3)' }}>
          <div>
            <div className="w-16 h-16 rounded-full grid place-items-center mx-auto mb-4" style={{ background: 'var(--surface)', color: 'var(--accent)' }}>
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            </div>
            <h3 className="font-display text-2xl mb-1" style={{ color: 'var(--text)' }}>Selecione uma conversa</h3>
            <small>Atena atende sozinha. Você assume quando precisar.</small>
          </div>
        </div>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setMediaFile(file);
    e.target.value = '';
  };

  const handleMediaSend = async () => {
    if (!mediaFile) return;
    await onSendMedia(mediaFile, mediaCaption.trim());
    setMediaFile(null);
    setMediaCaption('');
  };

  return (
    <div className="flex flex-col overflow-hidden">
      {/* Header da conversa */}
      <div className="px-6 py-4 flex justify-between items-center" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-2)' }}>
        <div className="flex items-center gap-3">
          <Avatar name={conv.person.name || conv.person.phone} student={conv.type === 'STUDENT'} />
          <div>
            <h3 className="font-semibold text-base flex items-center gap-2">
              {conv.person.name || 'Sem nome'}
              {conv.type === 'STUDENT' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded uppercase tracking-[0.08em]" style={{ background: 'rgba(74,222,128,0.15)', color: 'var(--success)' }}>
                  Aluno
                </span>
              )}
            </h3>
            <small className="text-[11px]" style={{ color: 'var(--text-3)' }}>{conv.person.phone}</small>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <StatusPill status={conv.status} />
          {isPaused ? (
            <button onClick={onResume} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
              Devolver pra Atena
            </button>
          ) : (
            <button onClick={onPause} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)', color: 'var(--accent)' }}>
              Pausar IA · Assumir
            </button>
          )}
          <button
            onClick={onDelete}
            title="Apagar conversa e lead (para testes)"
            className="w-9 h-9 rounded-lg grid place-items-center transition-colors"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-3)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--danger)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--danger)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-3)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; }}
          >
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Banner de pausa */}
      {isPaused && (
        <div className="px-6 py-2 text-xs" style={{ background: 'rgba(240,160,32,0.15)', borderBottom: '1px solid rgba(240,160,32,0.3)', color: 'var(--human)' }}>
          ⏸ Atena pausada. Tudo que digitar vai direto pro cliente.
        </div>
      )}

      {/* Erro de envio */}
      {sendError && (
        <div className="px-6 py-2 text-xs flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.12)', borderBottom: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {sendError}
        </div>
      )}

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {conv.messages.map(m => <MessageBubble key={m.id} m={m} />)}
        <div ref={messagesEndRef} />
      </div>

      {/* Preview de mídia selecionada */}
      {mediaFile && isPaused && (
        <div className="px-6 py-3 flex items-center gap-3" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-lg">{mediaFile.type.startsWith('video/') ? '🎬' : '📷'}</span>
            <span className="text-sm truncate" style={{ color: 'var(--text-2)' }}>{mediaFile.name}</span>
          </div>
          <input
            type="text"
            value={mediaCaption}
            onChange={e => setMediaCaption(e.target.value)}
            placeholder="Legenda (opcional)"
            className="flex-1 rounded-lg px-3 py-1.5 text-sm"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', outline: 'none' }}
          />
          <button
            onClick={handleMediaSend}
            disabled={enviandoMidia}
            className="px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{ background: 'var(--accent)', color: 'white', opacity: enviandoMidia ? 0.6 : 1 }}
          >
            {enviandoMidia ? 'Enviando...' : 'Enviar'}
          </button>
          <button
            onClick={() => { setMediaFile(null); setMediaCaption(''); }}
            className="w-7 h-7 rounded-lg grid place-items-center"
            style={{ background: 'var(--surface-2)', color: 'var(--text-3)' }}
          >
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      )}

      {/* Input */}
      <div style={{ background: 'var(--bg-2)', borderTop: '1px solid var(--border)' }}>
        {gravando && (
          <div className="px-6 py-2 flex items-center gap-2 text-xs font-medium" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderBottom: '1px solid rgba(239,68,68,0.2)' }}>
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Gravando... solte o botão para enviar
          </div>
        )}
        <div className="px-6 py-4 flex gap-2.5 items-end">

          {/* Input de arquivo oculto */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Botão de mídia */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={!isPaused}
            title="Enviar imagem ou vídeo"
            className="w-10 h-10 rounded-xl grid place-items-center flex-shrink-0 transition-colors"
            style={{
              background: isPaused ? 'var(--surface)' : 'var(--surface-2)',
              border: '1px solid var(--border)',
              color: isPaused ? 'var(--text-2)' : 'var(--text-3)',
              cursor: isPaused ? 'pointer' : 'not-allowed',
            }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21"/>
            </svg>
          </button>

          <textarea
            value={input}
            onChange={e => onInputChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
            placeholder={isPaused ? 'Sua mensagem vai direto pro cliente...' : 'Pause a Atena pra responder.'}
            disabled={!isPaused || sending}
            className="flex-1 rounded-xl px-3 py-2.5 text-sm resize-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', minHeight: 40, maxHeight: 120, outline: 'none' }}
          />

          {/* Botão enviar texto */}
          <button
            onClick={onSend}
            disabled={!isPaused || sending || !input.trim()}
            className="w-10 h-10 rounded-xl grid place-items-center flex-shrink-0"
            style={{
              background: isPaused && input.trim() ? 'var(--accent)' : 'var(--surface-2)',
              color: isPaused && input.trim() ? 'white' : 'var(--text-3)',
              cursor: isPaused && input.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l14-7-7 14-2-5-5-2z"/>
            </svg>
          </button>

          {/* Botão de áudio (segurar pra gravar) */}
          <button
            onMouseDown={onStartRecording}
            onMouseUp={onStopRecording}
            onTouchStart={onStartRecording}
            onTouchEnd={onStopRecording}
            disabled={!isPaused || enviandoAudio}
            title={gravando ? 'Solte pra enviar' : 'Segurar pra gravar áudio'}
            className="w-10 h-10 rounded-xl grid place-items-center flex-shrink-0 transition-all select-none"
            style={{
              background: gravando ? '#ef4444' : enviandoAudio ? 'var(--surface-2)' : isPaused ? 'var(--surface)' : 'var(--surface-2)',
              border: `1px solid ${gravando ? '#ef4444' : 'var(--border)'}`,
              color: gravando ? 'white' : isPaused ? 'var(--text-2)' : 'var(--text-3)',
              cursor: isPaused && !enviandoAudio ? 'pointer' : 'not-allowed',
              transform: gravando ? 'scale(1.1)' : 'scale(1)',
            }}
          >
            {enviandoAudio ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
            ) : (
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="2" width="6" height="12" rx="3"/>
                <path strokeLinecap="round" d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="22"/>
                <line x1="9" y1="22" x2="15" y2="22"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

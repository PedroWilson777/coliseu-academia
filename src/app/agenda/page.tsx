'use client';

import { useEffect, useState, useCallback } from 'react';
import { AppShell } from '@/components/AppShell';

interface AppointmentItem {
  id: string;
  scheduledAt: string;
  modality: string;
  type: string;
  status: string;
  notes: string | null;
  teacher: { id: string; name: string };
  lead: { name: string | null; phone: string } | null;
  student: { name: string; phone: string } | null;
}

interface Teacher {
  id: string;
  name: string;
  modalities: string[];
}

const MODALITY_COLORS: Record<string, string> = {
  PILATES: 'var(--pilates, #a78bfa)',
  MUSCULACAO: 'var(--musculacao, #f97316)',
  CROSSTRAINING: 'var(--crosstraining, #22d3ee)',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  SCHEDULED: { label: 'Agendado', color: 'var(--text-2)' },
  CONFIRMED: { label: 'Confirmado', color: '#22c55e' },
  COMPLETED: { label: 'Concluído', color: '#6366f1' },
  NO_SHOW: { label: 'Faltou', color: 'var(--danger, #ef4444)' },
  CANCELLED: { label: 'Cancelado', color: 'var(--text-3)' },
};

function toLocalDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function AgendaPage() {
  return <AppShell><Content /></AppShell>;
}

function Content() {
  const today = toLocalDateStr(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [items, setItems] = useState<AppointmentItem[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filterTeacher, setFilterTeacher] = useState('all');
  const [filterType, setFilterType] = useState<'all' | 'EXPERIMENTAL' | 'REGULAR'>('all');
  const [showCancelled, setShowCancelled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      let url = '';
      if (viewMode === 'day') {
        url = `/api/appointments?date=${selectedDate}`;
      } else {
        const d = new Date(selectedDate + 'T12:00:00');
        const day = d.getDay();
        const diffToMonday = (day === 0 ? -6 : 1 - day);
        const monday = new Date(d);
        monday.setDate(d.getDate() + diffToMonday);
        url = `/api/appointments?date=${toLocalDateStr(monday)}&days=7`;
      }
      if (filterTeacher !== 'all') url += `&teacherId=${filterTeacher}`;
      const res = await fetch(url);
      if (res.ok) setItems(await res.json());
    } finally {
      setLoading(false);
    }
  }, [selectedDate, viewMode, filterTeacher]);

  useEffect(() => {
    loadAppointments();
    fetch('/api/teachers').then(r => r.json()).then(setTeachers).catch(() => {});
  }, [loadAppointments]);

  const cancelAppointment = async (id: string) => {
    if (!confirm('Cancelar esta aula?')) return;
    await fetch(`/api/appointments?id=${id}`, { method: 'DELETE' });
    await loadAppointments();
  };

  const navigateDay = (delta: number) => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + (viewMode === 'week' ? delta * 7 : delta));
    setSelectedDate(toLocalDateStr(d));
  };

  const filtered = items.filter(a => {
    if (!showCancelled && a.status === 'CANCELLED') return false;
    if (filterType !== 'all' && a.type !== filterType) return false;
    return true;
  });

  const byDay: Record<string, AppointmentItem[]> = {};
  filtered.forEach(a => {
    const day = toLocalDateStr(new Date(a.scheduledAt));
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(a);
  });

  const formatDayLabel = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    const isToday = dateStr === today;
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
      + (isToday ? ' — hoje' : '');
  };

  const totalActive = items.filter(a => a.status !== 'CANCELLED').length;

  return (
    <div className="animate-fade-up">
      <div className="px-10 pt-8 pb-6" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-display text-5xl tracking-tight leading-none mb-2 brand-glow">AGENDA</h1>
            <p style={{ color: 'var(--text-2)' }}>{totalActive} aula{totalActive !== 1 ? 's' : ''} no período</p>
          </div>
          <button onClick={() => setShowBookingModal(true)} className="px-5 py-2.5 rounded-xl font-medium text-sm" style={{ background: 'var(--accent)', color: '#fff' }}>
            + Novo agendamento
          </button>
        </div>
      </div>

      <div className="px-10 py-7">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigateDay(-1)} className="w-9 h-9 rounded-lg grid place-items-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>‹</button>
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-1)' }} />
          <button onClick={() => navigateDay(1)} className="w-9 h-9 rounded-lg grid place-items-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>›</button>
          <button onClick={() => setSelectedDate(today)} className="px-3 py-2 rounded-lg text-xs" style={{ background: selectedDate === today ? 'var(--accent-soft)' : 'var(--surface)', color: selectedDate === today ? 'var(--accent)' : 'var(--text-2)', border: '1px solid var(--border)' }}>Hoje</button>
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {(['day', 'week'] as const).map(m => (
              <button key={m} onClick={() => setViewMode(m)} className="px-3 py-2 text-xs" style={{ background: viewMode === m ? 'var(--accent-soft)' : 'var(--surface)', color: viewMode === m ? 'var(--accent)' : 'var(--text-2)' }}>
                {m === 'day' ? 'Dia' : 'Semana'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <select value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)} className="px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-1)' }}>
            <option value="all">Todos os professores</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          {(['all', 'EXPERIMENTAL', 'REGULAR'] as const).map(f => (
            <button key={f} onClick={() => setFilterType(f)} className="px-4 py-2 rounded-lg text-sm" style={{ background: filterType === f ? 'var(--accent-soft)' : 'var(--surface)', color: filterType === f ? 'var(--accent)' : 'var(--text-2)', border: `1px solid ${filterType === f ? 'var(--accent)' : 'var(--border)'}` }}>
              {f === 'all' ? 'Todas' : f === 'EXPERIMENTAL' ? '🎯 Experimentais' : '📚 Regulares'}
            </button>
          ))}
          <button onClick={() => setShowCancelled(v => !v)} className="px-4 py-2 rounded-lg text-sm" style={{ background: 'var(--surface)', color: showCancelled ? 'var(--text-2)' : 'var(--text-3)', border: '1px solid var(--border)' }}>
            {showCancelled ? '👁 Ocultar cancelados' : '👁 Ver cancelados'}
          </button>
        </div>

        {loading && <div className="text-center py-8" style={{ color: 'var(--text-3)' }}>Carregando...</div>}

        {!loading && Object.keys(byDay).length === 0 && (
          <div className="text-center py-20" style={{ color: 'var(--text-3)' }}>
            <div className="text-4xl mb-3">📅</div>
            <p>Nenhuma aula para este período.</p>
            <p className="text-xs mt-2">Use "+ Novo agendamento" para adicionar manualmente.</p>
          </div>
        )}

        {Object.entries(byDay).map(([day, dayItems]) => (
          <div key={day} className="mb-8">
            <h3 className="font-display text-lg mb-3 capitalize" style={{ color: 'var(--text-2)' }}>{formatDayLabel(day)}</h3>
            <div className="grid grid-cols-2 gap-3">
              {dayItems.map(a => {
                const time = new Date(a.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                const modalityColor = MODALITY_COLORS[a.modality] || 'var(--text-2)';
                const person = a.lead || a.student;
                const statusInfo = STATUS_LABELS[a.status] || { label: a.status, color: 'var(--text-2)' };
                const isCancelled = a.status === 'CANCELLED';
                return (
                  <div key={a.id} className="rounded-xl p-4" style={{ background: 'var(--surface)', border: `1px solid ${isCancelled ? 'var(--border)' : a.type === 'EXPERIMENTAL' ? 'var(--warning, #f59e0b)' : 'var(--border)'}`, opacity: isCancelled ? 0.5 : 1 }}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-display text-2xl">{time}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: 'var(--bg-2)', color: modalityColor }}>{a.modality}</span>
                        {!isCancelled && <button onClick={() => cancelAppointment(a.id)} title="Cancelar" className="text-[11px] px-2 py-0.5 rounded" style={{ color: 'var(--text-3)', background: 'var(--bg-2)' }}>✕</button>}
                      </div>
                    </div>
                    <div className="text-sm font-medium">{person?.name || 'Sem nome'}</div>
                    <div className="text-xs font-mono mb-1" style={{ color: 'var(--text-3)' }}>{person?.phone}</div>
                    {a.notes && <div className="text-xs mb-1 italic" style={{ color: 'var(--text-3)' }}>{a.notes}</div>}
                    <div className="flex justify-between items-center text-[11px] pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-2)' }}>👨‍🏫 {a.teacher.name}</span>
                      <span style={{ color: statusInfo.color }}>{statusInfo.label}</span>
                    </div>
                    {a.type === 'EXPERIMENTAL' && !isCancelled && <div className="text-[10px] mt-1" style={{ color: 'var(--warning, #f59e0b)' }}>🎯 Aula experimental</div>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {showBookingModal && <BookingModal teachers={teachers} defaultDate={selectedDate} onClose={() => setShowBookingModal(false)} onSaved={() => { setShowBookingModal(false); loadAppointments(); }} />}
    </div>
  );
}

interface BookingModalProps { teachers: Teacher[]; defaultDate: string; onClose: () => void; onSaved: () => void; }

function BookingModal({ teachers, defaultDate, onClose, onSaved }: BookingModalProps) {
  const [teacherId, setTeacherId] = useState(teachers[0]?.id || '');
  const [modality, setModality] = useState('CROSSTRAINING');
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState('08:00');
  const [type, setType] = useState('EXPERIMENTAL');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!teacherId || !modality || !date || !time) { setError('Preencha professor, modalidade, data e horário.'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/appointments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ teacherId, modality, scheduledAt: `${date}T${time}:00`, type, clientName, clientPhone, notes }) });
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Erro ao salvar'); } else { onSaved(); }
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: 'var(--bg-1)', border: '1px solid var(--border)' }}>
        <div className="flex justify-between items-center mb-5"><h2 className="font-display text-xl">Novo Agendamento</h2><button onClick={onClose} style={{ color: 'var(--text-3)' }}>✕</button></div>
        <div className="space-y-4">
          <div><label className="block text-xs mb-1" style={{ color: 'var(--text-2)' }}>Professor</label>
            <select value={teacherId} onChange={e => setTeacherId(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-1)' }}>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs mb-1" style={{ color: 'var(--text-2)' }}>Modalidade</label>
              <select value={modality} onChange={e => setModality(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-1)' }}>
                <option value="CROSSTRAINING">CrossTraining</option><option value="PILATES">Pilates</option><option value="MUSCULACAO">Musculação</option>
              </select></div>
            <div><label className="block text-xs mb-1" style={{ color: 'var(--text-2)' }}>Tipo</label>
              <select value={type} onChange={e => setType(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-1)' }}>
                <option value="EXPERIMENTAL">Experimental</option><option value="REGULAR">Regular</option>
              </select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs mb-1" style={{ color: 'var(--text-2)' }}>Data</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-1)' }} /></div>
            <div><label className="block text-xs mb-1" style={{ color: 'var(--text-2)' }}>Horário</label><input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-1)' }} /></div>
          </div>
          <div><label className="block text-xs mb-1" style={{ color: 'var(--text-2)' }}>Nome do cliente</label><input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Ex: João Silva" className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-1)' }} /></div>
          <div><label className="block text-xs mb-1" style={{ color: 'var(--text-2)' }}>WhatsApp (só números)</label><input type="text" value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="5573999990000" className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-1)' }} /></div>
          <div><label className="block text-xs mb-1" style={{ color: 'var(--text-2)' }}>Observações</label><input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ex: Vai trazer namorada" className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-1)' }} /></div>
          {error && <p className="text-sm" style={{ color: 'var(--danger, #ef4444)' }}>{error}</p>}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ background: 'var(--accent)', color: '#fff', opacity: saving ? 0.6 : 1 }}>{saving ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

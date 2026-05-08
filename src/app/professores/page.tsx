'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';

interface Teacher {
  id: string;
  name: string;
  modalities: string[];
  hourlyRate: number; // centavos
  isOwner: boolean;
  active: boolean;
  user: { email: string; image: string | null };
  _count: { appointments: number };
}

export default function ProfessoresPage() {
  return <AppShell><Content /></AppShell>;
}

function Content() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);

  const load = async () => {
    const res = await fetch('/api/teachers');
    if (res.ok) setTeachers(await res.json());
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esse professor?')) return;
    await fetch(`/api/teachers?id=${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="animate-fade-up">
      <div className="px-10 pt-8 pb-6 flex justify-between items-end" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="font-display text-5xl tracking-tight leading-none mb-2 brand-glow">PROFESSORES</h1>
          <p style={{ color: 'var(--text-2)' }}>{teachers.length} cadastrados</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="px-5 py-2.5 rounded-lg font-medium"
          style={{ background: 'var(--accent)', color: 'white' }}
        >
          + Novo professor
        </button>
      </div>

      <div className="px-10 py-7">
        {teachers.length === 0 ? (
          <div className="text-center py-16" style={{ color: 'var(--text-3)' }}>
            <div className="text-4xl mb-3">🏋️</div>
            <p>Nenhum professor cadastrado.</p>
            <p className="text-xs mt-2">Cadastre os professores pra eles aparecerem na agenda e poderem fazer login.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {teachers.map(t => (
              <div key={t.id} className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-display text-xl">{t.name}</div>
                    <div className="text-xs font-mono" style={{ color: 'var(--text-3)' }}>{t.user.email}</div>
                  </div>
                  {t.isOwner && (
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                      👑 Dono
                    </span>
                  )}
                </div>

                <div className="flex gap-1.5 flex-wrap mb-3">
                  {t.modalities.map(m => (
                    <span key={m} className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: 'var(--bg-2)', color: 'var(--text-2)' }}>
                      {m}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Valor/hora</div>
                    <div className="font-medium">
                      {t.isOwner ? '— pró-labore' : `R$ ${(t.hourlyRate/100).toFixed(2)}`}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Aulas marcadas</div>
                    <div className="font-medium">{t._count.appointments}</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => { setEditing(t); setShowForm(true); }} className="flex-1 text-xs px-2 py-1.5 rounded" style={{ background: 'var(--bg-2)', color: 'var(--text-2)' }}>Editar</button>
                  <button onClick={() => handleDelete(t.id)} className="text-xs px-3 py-1.5 rounded" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}>Excluir</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <TeacherForm
          teacher={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { load(); setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

function TeacherForm({ teacher, onClose, onSaved }: { teacher: Teacher | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: teacher?.name || '',
    email: teacher?.user.email || '',
    modalities: teacher?.modalities || ['CROSSTRAINING'],
    hourlyRate: teacher ? (teacher.hourlyRate / 100).toString() : '20',
    isOwner: teacher?.isOwner || false,
  });
  const [saving, setSaving] = useState(false);

  const toggleModality = (m: string) => {
    setForm(f => ({
      ...f,
      modalities: f.modalities.includes(m) ? f.modalities.filter(x => x !== m) : [...f.modalities, m],
    }));
  };

  const handleSubmit = async () => {
    if (form.modalities.length === 0) {
      alert('Selecione pelo menos uma modalidade.');
      return;
    }
    setSaving(true);
    try {
      const url = '/api/teachers';
      const method = teacher ? 'PATCH' : 'POST';
      const body = teacher ? { id: teacher.id, ...form } : form;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) onSaved();
      else alert('Erro ao salvar.');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-6" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-md rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <h2 className="font-display text-2xl mb-5">{teacher ? 'Editar professor' : 'Novo professor'}</h2>

        <Field label="Nome">
          <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" />
        </Field>
        <Field label="Email Google (pra login)">
          <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} disabled={!!teacher} placeholder="exemplo@gmail.com" className="input" />
          {!teacher && (
            <small style={{ color: 'var(--text-3)' }} className="text-[11px] mt-1 block">
              Esse email vai poder fazer login. Não pode ser mudado depois.
            </small>
          )}
        </Field>

        <Field label="Modalidades que dá aula">
          <div className="flex gap-2 flex-wrap">
            {['PILATES', 'MUSCULACAO', 'CROSSTRAINING'].map(m => (
              <button
                key={m}
                onClick={() => toggleModality(m)}
                className="px-3 py-2 rounded-lg text-xs uppercase tracking-wider"
                style={{
                  background: form.modalities.includes(m) ? 'var(--accent-soft)' : 'var(--bg-2)',
                  color: form.modalities.includes(m) ? 'var(--accent)' : 'var(--text-2)',
                  border: `1px solid ${form.modalities.includes(m) ? 'var(--accent)' : 'var(--border)'}`,
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Valor por hora (R$)">
          <input type="number" step="0.50" value={form.hourlyRate} onChange={e => setForm({...form, hourlyRate: e.target.value})} disabled={form.isOwner} className="input" />
        </Field>

        <div className="mb-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isOwner} onChange={e => setForm({...form, isOwner: e.target.checked})} />
            <span className="text-sm">É dono (recebe pró-labore, sem cálculo de salário)</span>
          </label>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg" style={{ background: 'var(--bg-2)', color: 'var(--text)', border: '1px solid var(--border)' }}>Cancelar</button>
          <button onClick={handleSubmit} disabled={saving || !form.name || !form.email} className="flex-1 px-4 py-2.5 rounded-lg font-medium" style={{ background: 'var(--accent)', color: 'white', opacity: saving || !form.name || !form.email ? 0.5 : 1 }}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          padding: 8px 12px;
          background: var(--bg-2);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text);
          font-size: 14px;
          outline: none;
        }
        .input:disabled {
          opacity: 0.5;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="block text-[11px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-3)' }}>{label}</label>
      {children}
    </div>
  );
}

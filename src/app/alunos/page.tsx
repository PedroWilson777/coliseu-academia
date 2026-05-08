'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';

interface Plan { id: string; modality: string; name: string; frequency: string; priceInCents: number }
interface Student {
  id: string; name: string; phone: string; email: string | null;
  modality: string; planId: string | null;
  paymentDay: number | null; status: string;
  plan: Plan | null;
}

export default function AlunosPage() {
  return <AppShell><Content /></AppShell>;
}

function Content() {
  const [students, setStudents] = useState<Student[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [search, setSearch] = useState('');

  const load = async () => {
    const [s, p] = await Promise.all([fetch('/api/students'), fetch('/api/plans')]);
    if (s.ok) setStudents(await s.json());
    if (p.ok) setPlans(await p.json());
  };

  useEffect(() => { load(); }, []);

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.phone.includes(q);
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esse aluno? Essa ação não pode ser desfeita.')) return;
    await fetch(`/api/students?id=${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="animate-fade-up">
      <div className="px-10 pt-8 pb-6 flex justify-between items-end" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="font-display text-5xl tracking-tight leading-none mb-2 brand-glow">ALUNOS</h1>
          <p style={{ color: 'var(--text-2)' }}>{students.length} cadastrados</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="px-5 py-2.5 rounded-lg font-medium"
          style={{ background: 'var(--accent)', color: 'white' }}
        >
          + Novo aluno
        </button>
      </div>

      <div className="px-10 py-7">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome ou telefone..."
          className="w-full max-w-md px-4 py-2.5 rounded-lg text-sm mb-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
        />

        {filtered.length === 0 ? (
          <div className="text-center py-16" style={{ color: 'var(--text-3)' }}>
            <div className="text-4xl mb-3">👥</div>
            <p>{search ? 'Nenhum aluno encontrado.' : 'Nenhum aluno cadastrado ainda.'}</p>
            {!search && (
              <p className="text-xs mt-2">Clique em &quot;Novo aluno&quot; pra começar.</p>
            )}
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--border)' }}>
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Nome</th>
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Telefone</th>
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Modalidade</th>
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Plano</th>
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Dia venc.</th>
                  <th className="text-right px-4 py-3 text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-2)' }}>{s.phone}</td>
                    <td className="px-4 py-3 text-xs uppercase tracking-wider">{s.modality}</td>
                    <td className="px-4 py-3 text-xs">
                      {s.plan ? `${s.plan.name} ${s.plan.frequency}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs">{s.paymentDay || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => { setEditing(s); setShowForm(true); }} className="text-xs px-2 py-1 rounded mr-1" style={{ background: 'var(--bg-2)', color: 'var(--text-2)' }}>Editar</button>
                      <button onClick={() => handleDelete(s.id)} className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}>Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <StudentForm
          student={editing}
          plans={plans}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { load(); setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

function StudentForm({ student, plans, onClose, onSaved }: { student: Student | null; plans: Plan[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: student?.name || '',
    phone: student?.phone || '55',
    email: student?.email || '',
    modality: student?.modality || 'CROSSTRAINING',
    planId: student?.planId || '',
    paymentDay: student?.paymentDay?.toString() || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const url = '/api/students';
      const method = student ? 'PATCH' : 'POST';
      const body = student ? { id: student.id, ...form } : form;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) onSaved();
      else alert('Erro ao salvar.');
    } finally { setSaving(false); }
  };

  const filteredPlans = plans.filter(p => p.modality === form.modality);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-6" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-md rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <h2 className="font-display text-2xl mb-5">{student ? 'Editar aluno' : 'Novo aluno'}</h2>

        <Field label="Nome">
          <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" />
        </Field>
        <Field label="Telefone (com 55)">
          <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value.replace(/\D/g, '')})} placeholder="5573988207777" className="input font-mono" />
        </Field>
        <Field label="Email (opcional)">
          <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input" />
        </Field>
        <Field label="Modalidade">
          <select value={form.modality} onChange={e => setForm({...form, modality: e.target.value, planId: ''})} className="input">
            <option value="PILATES">Pilates</option>
            <option value="MUSCULACAO">Musculação</option>
            <option value="CROSSTRAINING">CrossTraining</option>
          </select>
        </Field>
        <Field label="Plano">
          <select value={form.planId} onChange={e => setForm({...form, planId: e.target.value})} className="input">
            <option value="">— sem plano —</option>
            {filteredPlans.map(p => (
              <option key={p.id} value={p.id}>{p.name} {p.frequency} - R$ {(p.priceInCents/100).toFixed(2)}</option>
            ))}
          </select>
        </Field>
        <Field label="Dia do vencimento (1-31)">
          <input type="number" min={1} max={31} value={form.paymentDay} onChange={e => setForm({...form, paymentDay: e.target.value})} className="input" />
        </Field>

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg" style={{ background: 'var(--bg-2)', color: 'var(--text)', border: '1px solid var(--border)' }}>Cancelar</button>
          <button onClick={handleSubmit} disabled={saving || !form.name || !form.phone} className="flex-1 px-4 py-2.5 rounded-lg font-medium" style={{ background: 'var(--accent)', color: 'white', opacity: saving || !form.name || !form.phone ? 0.5 : 1 }}>
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

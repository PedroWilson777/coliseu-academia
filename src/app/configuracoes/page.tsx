'use client';

import { useEffect, useState, useCallback } from 'react';
import { AppShell } from '@/components/AppShell';

interface Settings {
  shop_name?: string;
  shop_address?: string;
  shop_hours?: string;
  payment_methods?: string;
  capacity_pilates?: string;
  capacity_musculacao?: string;
  capacity_crosstraining?: string;
  experimental_active?: string;
  ai_active?: string;
}

export default function ConfigPage() {
  return (
    <AppShell>
      <ConfigContent />
    </AppShell>
  );
}

function ConfigContent() {
  const [settings, setSettings] = useState<Settings>({});
  const [form, setForm] = useState<Settings>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const data = await res.json();
      setSettings(data);
      setForm(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const handleChange = (key: keyof Settings, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleToggle = (key: keyof Settings) => {
    const current = form[key] === 'true';
    handleChange(key, String(!current));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Erro ao salvar');
      setSettings(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setSaving(false);
    }
  };

  const isDirty = JSON.stringify(form) !== JSON.stringify(settings);

  if (loading) {
    return (
      <div className="grid place-items-center h-64">
        <div className="w-8 h-8 rounded-full animate-pulse-soft" style={{ background: 'var(--accent)' }} />
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <div className="px-10 pt-8 pb-6 flex items-end justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="font-display text-5xl tracking-tight leading-none mb-2 brand-glow">CONFIGURAÇÕES</h1>
          <p style={{ color: 'var(--text-2)' }}>Academia · Atena · Capacidade</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-sm font-medium" style={{ color: 'var(--success)' }}>✅ Salvo!</span>
          )}
          {error && (
            <span className="text-sm" style={{ color: 'var(--danger)' }}>❌ {error}</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: isDirty ? 'var(--accent)' : 'var(--surface-2)',
              color: isDirty ? 'white' : 'var(--text-3)',
              cursor: isDirty && !saving ? 'pointer' : 'not-allowed',
            }}
          >
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </div>

      <div className="px-10 py-7 grid gap-6 max-w-[800px]">

        {/* DADOS DA ACADEMIA */}
        <Card title="🏛️ Dados da Academia">
          <Field
            label="Nome da academia"
            value={form.shop_name || ''}
            onChange={v => handleChange('shop_name', v)}
          />
          <Field
            label="Endereço"
            value={form.shop_address || ''}
            onChange={v => handleChange('shop_address', v)}
          />
          <Field
            label="Horário de funcionamento"
            placeholder="Segunda a Sábado, 5h às 22h"
            value={form.shop_hours || ''}
            onChange={v => handleChange('shop_hours', v)}
          />
          <Field
            label="Formas de pagamento"
            placeholder="PIX, cartão de crédito, débito..."
            value={form.payment_methods || ''}
            onChange={v => handleChange('payment_methods', v)}
          />
        </Card>

        {/* CAPACIDADE */}
        <Card title="🎯 Capacidade por Turma">
          <div className="grid grid-cols-3 gap-4">
            <NumberField
              label="Pilates (alunos/aula)"
              value={form.capacity_pilates || '4'}
              onChange={v => handleChange('capacity_pilates', v)}
              min={1}
              max={20}
            />
            <NumberField
              label="Musculação (alunos/personal)"
              value={form.capacity_musculacao || '2'}
              onChange={v => handleChange('capacity_musculacao', v)}
              min={1}
              max={10}
            />
            <NumberField
              label="CrossTraining (alunos/aula)"
              value={form.capacity_crosstraining || '22'}
              onChange={v => handleChange('capacity_crosstraining', v)}
              min={1}
              max={50}
            />
          </div>
        </Card>

        {/* ATENA */}
        <Card title="🤖 Atena — Assistente IA">
          <div className="flex flex-col gap-4">
            <Toggle
              label="Atena ativa"
              description="Quando desligada, nenhuma mensagem de WhatsApp recebe resposta automática."
              value={form.ai_active === 'true'}
              onChange={() => handleToggle('ai_active')}
            />
            <Toggle
              label="Aula experimental"
              description="Permite que a Atena ofereça e marque aulas experimentais automaticamente."
              value={form.experimental_active === 'true'}
              onChange={() => handleToggle('experimental_active')}
            />
          </div>
        </Card>

        {/* IMPORTAR ALUNOS */}
        <Card title="📥 Importar Alunos via CSV">
          <ImportStudents />
        </Card>

      </div>
    </div>
  );
}

// ============== COMPONENTES ==============

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <h2 className="font-display text-xl mb-4 tracking-tight">{title}</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5 uppercase tracking-[0.08em]" style={{ color: 'var(--text-3)' }}>
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 rounded-xl text-sm"
        style={{
          background: 'var(--bg-2)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
          outline: 'none',
        }}
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  min: number;
  max: number;
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5 uppercase tracking-[0.08em]" style={{ color: 'var(--text-3)' }}>
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        min={min}
        max={max}
        className="w-full px-3.5 py-2.5 rounded-xl text-sm"
        style={{
          background: 'var(--bg-2)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
          outline: 'none',
        }}
      />
    </div>
  );
}

function Toggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>{label}</div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{description}</div>
      </div>
      <button
        onClick={onChange}
        className="relative flex-shrink-0 w-12 h-6 rounded-full transition-all"
        style={{
          background: value ? 'var(--accent)' : 'var(--surface-2)',
          border: `1px solid ${value ? 'var(--accent)' : 'var(--border)'}`,
        }}
      >
        <span
          className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
          style={{
            background: value ? 'white' : 'var(--text-3)',
            left: value ? '26px' : '2px',
          }}
        />
      </button>
    </div>
  );
}

function ImportStudents() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number; total: number; errors: string[] } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleImport = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);
    setImportError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/students/import', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao importar');
      setResult(data);
      setFile(null);
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <p className="text-sm mb-3" style={{ color: 'var(--text-2)' }}>
        Importe alunos a partir de uma planilha CSV. Colunas esperadas:
      </p>
      <div className="rounded-lg px-4 py-3 text-xs font-mono mb-4" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
        nome, telefone, modalidade, plano, dia_pagamento, email
      </div>
      <p className="text-xs mb-4" style={{ color: 'var(--text-3)' }}>
        modalidade: PILATES | MUSCULACAO | CROSSTRAINING · telefone: só números · alunos com telefone duplicado serão ignorados
      </p>

      <div className="flex gap-3 items-center">
        <label
          className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all"
          style={{
            background: 'var(--bg-2)',
            border: `1px dashed ${file ? 'var(--accent)' : 'var(--border)'}`,
            color: file ? 'var(--accent)' : 'var(--text-2)',
          }}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span className="text-sm">{file ? file.name : 'Selecionar arquivo CSV'}</span>
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={e => { setFile(e.target.files?.[0] || null); setResult(null); }}
          />
        </label>

        <button
          onClick={handleImport}
          disabled={!file || uploading}
          className="px-5 py-3 rounded-xl text-sm font-medium transition-all flex-shrink-0"
          style={{
            background: file && !uploading ? 'var(--accent)' : 'var(--surface-2)',
            color: file && !uploading ? 'white' : 'var(--text-3)',
            cursor: file && !uploading ? 'pointer' : 'not-allowed',
          }}
        >
          {uploading ? 'Importando...' : 'Importar'}
        </button>
      </div>

      {result && (
        <div className="mt-4 rounded-xl p-4" style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.3)' }}>
          <div className="text-sm font-medium mb-1" style={{ color: 'var(--success)' }}>
            ✅ Importação concluída — {result.total} linhas lidas
          </div>
          <div className="text-xs" style={{ color: 'var(--text-2)' }}>
            {result.created} criados · {result.skipped} ignorados (duplicados)
          </div>
          {result.errors.length > 0 && (
            <div className="mt-2 text-xs" style={{ color: 'var(--danger)' }}>
              Erros: {result.errors.join(' · ')}
            </div>
          )}
        </div>
      )}

      {importError && (
        <div className="mt-4 rounded-xl p-4 text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--danger)' }}>
          ❌ {importError}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <LoginContent />
    </Suspense>
  );
}

function LoadingScreen() {
  return (
    <div className="grid place-items-center min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="w-12 h-12 rounded-full animate-pulse-soft" style={{ background: 'var(--accent)' }} />
    </div>
  );
}

// Converte username → email interno
// Ex: "jordancoliseu" → "jordancoliseu@closefit.com"
// Ex: "pedro@gmail.com" → "pedro@gmail.com" (admin)
function toEmail(username: string): string {
  const trimmed = username.trim().toLowerCase();
  if (trimmed.includes('@')) return trimmed;
  return `${trimmed}@closefit.com`;
}

function LoginContent() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Se já está logado, redireciona
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/');
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password || loading) return;

    setLoading(true);
    setError(null);

    const email = toEmail(username);
    const supabase = createClient();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError('Usuário ou senha incorretos.');
      return;
    }

    router.push('/');
    router.refresh();
  };

  return (
    <div
      className="min-h-screen w-full grid place-items-center p-6"
      style={{
        background: `radial-gradient(circle at 50% 30%, var(--accent-soft), transparent 60%), var(--bg)`,
      }}
    >
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div
            className="w-20 h-20 rounded-full grid place-items-center"
            style={{
              background: 'linear-gradient(135deg, var(--accent), #8b1820)',
              boxShadow: '0 0 0 1px var(--accent), 0 0 40px var(--accent-glow)',
            }}
          >
            <span className="font-display text-4xl text-white">C</span>
          </div>
        </div>

        <h1 className="font-display text-6xl mb-3 brand-glow" style={{ color: 'var(--text)', letterSpacing: '0.05em' }}>
          COLISEU
        </h1>
        <p className="text-sm uppercase tracking-[0.2em] mb-12" style={{ color: 'var(--text-3)' }}>
          Painel de Gestão
        </p>

        <div
          className="rounded-2xl p-8"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: '0 0 60px var(--accent-soft)',
          }}
        >
          <h2 className="font-display text-2xl mb-2">Acesso restrito</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-2)' }}>
            Entre com seu usuário e senha
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Usuário (ex: jordancoliseu)"
              required
              autoFocus
              autoComplete="username"
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl text-sm"
              style={{
                background: 'var(--bg-2)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                outline: 'none',
              }}
            />

            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Senha"
              required
              autoComplete="current-password"
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl text-sm"
              style={{
                background: 'var(--bg-2)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                outline: 'none',
              }}
            />

            <button
              type="submit"
              disabled={loading || !username.trim() || !password}
              className="w-full px-6 py-3 rounded-xl font-medium transition-all mt-1"
              style={{
                background: loading ? 'var(--surface-2)' : 'var(--accent)',
                color: 'white',
                opacity: loading || !username.trim() || !password ? 0.6 : 1,
                cursor: loading || !username.trim() || !password ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Entrando...' : '🏛️ Entrar'}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3 rounded-lg text-xs" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.3)' }}>
              ❌ {error}
            </div>
          )}

          <div className="mt-6 text-xs" style={{ color: 'var(--text-3)' }}>
            Apenas equipe autorizada tem acesso
          </div>
        </div>

        <p className="mt-8 text-xs" style={{ color: 'var(--text-4)' }}>
          🏛️ Coliseu Academia · Teixeira de Freitas - BA
        </p>
      </div>
    </div>
  );

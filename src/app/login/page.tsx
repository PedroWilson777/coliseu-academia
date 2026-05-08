'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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

function LoginContent() {
  const params = useSearchParams();
  const errorParam = params.get('error');

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(errorParam);

  useEffect(() => {
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [errorParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (signInError) {
      console.error(signInError);
      setError(signInError.message);
      return;
    }

    setSent(true);
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
          {!sent ? (
            <>
              <h2 className="font-display text-2xl mb-2">Acesso restrito</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-2)' }}>
                Digite seu email pra receber um link de acesso
              </p>

              <form onSubmit={handleSubmit}>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  autoFocus
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl text-sm mb-4"
                  style={{
                    background: 'var(--bg-2)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    outline: 'none',
                  }}
                />

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full px-6 py-3 rounded-xl font-medium transition-all"
                  style={{
                    background: loading ? 'var(--surface-2)' : 'var(--accent)',
                    color: 'white',
                    opacity: loading || !email.trim() ? 0.6 : 1,
                    cursor: loading || !email.trim() ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'Enviando...' : '📧 Receber link de acesso'}
                </button>
              </form>

              {error && (
                <div className="mt-4 p-3 rounded-lg text-xs" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  ❌ {error}
                </div>
              )}

              <div className="mt-6 text-xs" style={{ color: 'var(--text-3)' }}>
                Apenas admins e professores cadastrados<br/>têm acesso ao sistema
              </div>
            </>
          ) : (
            <>
              <div className="mb-4 text-5xl">📬</div>
              <h2 className="font-display text-2xl mb-3">Verifica teu email!</h2>
              <p className="text-sm mb-2" style={{ color: 'var(--text-2)' }}>
                Mandamos um link de acesso pra:
              </p>
              <p className="text-sm font-mono mb-6" style={{ color: 'var(--accent)' }}>
                {email}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                ⏱️ O link expira em 1 hora.<br/>
                Não esquece de checar a caixa de spam.
              </p>

              <button
                onClick={() => { setSent(false); setEmail(''); }}
                className="mt-6 text-sm underline"
                style={{ color: 'var(--text-2)' }}
              >
                Usar outro email
              </button>
            </>
          )}
        </div>

        <p className="mt-8 text-xs" style={{ color: 'var(--text-4)' }}>
          🏛️ Coliseu Academia · Teixeira de Freitas - BA
        </p>
      </div>
    </div>
  );
}

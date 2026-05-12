'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';

export default function LoginCodePage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <CodeContent />
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

function CodeContent() {
  const params = useSearchParams();
  const router = useRouter();
  const email = params.get('email') || '';

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (!email) {
      router.replace('/login');
    }
  }, [email, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6 || loading) return;

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    });

    setLoading(false);

    if (verifyError) {
      console.error(verifyError);
      setError('Código inválido ou expirado. Pede um novo código.');
      return;
    }

    router.push('/');
    router.refresh();
  };

  const handleResend = async () => {
    if (resending) return;
    setResending(true);
    setError(null);
    setResent(false);

    const supabase = createClient();
    const { error: resendError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });

    setResending(false);

    if (resendError) {
      setError(resendError.message);
      return;
    }

    setResent(true);
    setTimeout(() => setResent(false), 5000);
  };

  const handleCodeChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '').slice(0, 6);
    setCode(digitsOnly);
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
          <div className="mb-4 text-5xl">🔑</div>
          <h2 className="font-display text-2xl mb-3">Digite o código</h2>
          <p className="text-sm mb-2" style={{ color: 'var(--text-2)' }}>
            Mandamos um código de 6 dígitos pra:
          </p>
          <p className="text-sm font-mono mb-6" style={{ color: 'var(--accent)' }}>
            {email}
          </p>

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={code}
              onChange={e => handleCodeChange(e.target.value)}
              placeholder="000000"
              required
              autoFocus
              disabled={loading}
              maxLength={6}
              className="w-full px-4 py-4 rounded-xl mb-4 text-center font-mono"
              style={{
                background: 'var(--bg-2)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                outline: 'none',
                fontSize: '28px',
                letterSpacing: '0.5em',
              }}
            />

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full px-6 py-3 rounded-xl font-medium transition-all"
              style={{
                background: loading ? 'var(--surface-2)' : 'var(--accent)',
                color: 'white',
                opacity: loading || code.length !== 6 ? 0.6 : 1,
                cursor: loading || code.length !== 6 ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Verificando...' : '✓ Entrar'}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3 rounded-lg text-xs" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.3)' }}>
              ❌ {error}
            </div>
          )}

          {resent && (
            <div className="mt-4 p-3 rounded-lg text-xs" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}>
              ✓ Novo código enviado!
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-sm underline"
              style={{ color: 'var(--text-2)', opacity: resending ? 0.6 : 1 }}
            >
              {resending ? 'Enviando...' : 'Reenviar código'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-sm underline"
              style={{ color: 'var(--text-2)' }}
            >
              Usar outro email
            </button>
          </div>

          <p className="mt-6 text-xs" style={{ color: 'var(--text-3)' }}>
            ⏱️ O código expira em 1 hora.<br/>
            Não esquece de checar a caixa de spam.
          </p>
        </div>

        <p className="mt-8 text-xs" style={{ color: 'var(--text-4)' }}>
          🏛️ Coliseu Academia · Teixeira de Freitas - BA
        </p>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { Shield, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

// Converte username → email interno
// Ex: "jordancoliseu" → "jordancoliseu@closefit.com"
// Ex: "pedro@gmail.com" → "pedro@gmail.com"
function toEmail(username: string): string {
  const trimmed = username.trim().toLowerCase();
  if (trimmed.includes('@')) return trimmed;
  return `${trimmed}@closefit.com`;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ background: '#09090b', minHeight: '100vh' }} />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redireciona se já logado
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/');
    });
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const email = toEmail(username);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError('Usuário ou senha incorretos.');
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#09090b] relative overflow-hidden font-sans">
      {/* Background glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-900/10 blur-[120px] rounded-full" />

      <div className="w-full max-w-md p-6 relative z-10">
        {/* Logo */}
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center justify-center p-4 bg-emerald-500/10 rounded-3xl border border-emerald-500/20 mb-4">
            <h1 className="text-4xl font-black tracking-tighter text-white">
              Close<span className="text-emerald-500">Fit</span>
            </h1>
          </div>
          <p className="text-zinc-400 font-medium tracking-tight">O motor de vendas para academias de elite.</p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900/40 backdrop-blur-2xl p-10 rounded-[40px] border border-zinc-800/50 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-medium">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[3px] ml-1">Usuário</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-zinc-950/50 border border-zinc-800 rounded-2xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-medium"
                    placeholder="seu usuário ou e-mail"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[3px] ml-1">Senha</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-zinc-950/50 border border-zinc-800 rounded-2xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-medium"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group w-full relative h-14 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 text-zinc-950 font-black text-xs uppercase tracking-[3px] rounded-2xl transition-all shadow-xl shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.98] disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center gap-3">
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    ENTRAR NO PAINEL
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-10 flex items-center justify-center gap-2 text-zinc
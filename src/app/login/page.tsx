'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';

// Converte username → email interno
// Ex: "jordancoliseu" → "jordancoliseu@closefit.com"
// Ex: "pedro@gmail.com" → "pedro@gmail.com" (admin)
function toEmail(username: string): string {
  const trimmed = username.trim().toLowerCase();
  if (trimmed.includes('@')) return trimmed;
  return `${trimmed}@closefit.com`;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ background: '#0a0a0a', minHeight: '100vh' }} />}>
      <LandingWithModal />
    </Suspense>
  );
}

function LandingWithModal() {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redireciona se já logado
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/');
    });
  }, [router]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setError(null);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeModal]);

  useEffect(() => {
    document.body.style.overflow = modalOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [modalOpen]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: toEmail(username),
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
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        html { scroll-behavior: smooth; }

        .lp-root {
          min-height: 100vh;
          background: #F5F6F7;
          font-family: 'Inter', system-ui, sans-serif;
          color: #2B2E33;
          overflow-x: hidden;
        }

        .lp-nav {
          position: sticky; top: 0; z-index: 40;
          background: rgba(255,255,255,0.82);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(226,232,240,0.6);
          height: 60px;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 clamp(20px, 5vw, 48px);
        }
        .lp-logo { display: flex; align-items: center; gap: 9px; text-decoration: none; }
        .lp-logo-icon { width: 28px; height: 28px; background: #0F3F35; border-radius: 7px; display: flex; align-items: center; justify-content: center; }
        .lp-logo-text { font-size: 18px; font-weight: 900; color: #0F3F35; letter-spacing: -0.4px; }
        .lp-nav-links { display: flex; gap: 28px; }
        .lp-nav-link { font-size: 13px; color: #64748b; text-decoration: none; transition: color .2s; }
        .lp-nav-link:hover { color: #2F7F6D; }
        @media (max-width: 640px) { .lp-nav-links { display: none; } }
        .btn-painel { font-size: 13px; font-weight: 700; color: #0F3F35; background: none; border: none; cursor: pointer; transition: color .2s; }
        .btn-painel:hover { color: #2F7F6D; }
        .btn-diag { background: #0F3F35; color: white; font-size: 12px; font-weight: 700; padding: 8px 18px; border-radius: 50px; border: none; cursor: pointer; transition: background .2s, transform .15s; }
        .btn-diag:hover { background: #2F7F6D; transform: scale(1.04); }
        @media (max-width: 480px) { .btn-diag { display: none; } }

        .lp-hero {
          text-align: center;
          padding: clamp(48px, 8vw, 96px) clamp(20px, 5vw, 48px) clamp(32px, 5vw, 64px);
          position: relative; overflow: hidden;
        }
        .lp-hero::before {
          content: ''; position: absolute; inset: 0; z-index: 0;
          background: radial-gradient(ellipse at 50% 0%, #EAF5F1 0%, transparent 65%);
          opacity: 0.6; pointer-events: none;
        }
        .lp-hero > * { position: relative; z-index: 1; }
        .lp-badge { display: inline-flex; align-items: center; gap: 7px; background: rgba(234,245,241,0.7); border: 1px solid rgba(137,196,175,0.35); border-radius: 50px; padding: 5px 14px; margin-bottom: 22px; }
        .lp-badge-dot { width: 7px; height: 7px; border-radius: 50%; background: #2F7F6D; animation: cfPulse 2s ease-in-out infinite; }
        .lp-badge-text { font-size: 10px; font-weight: 700; color: #2F7F6D; letter-spacing: 1.2px; text-transform: uppercase; }
        .lp-h1 { font-size: clamp(32px, 6vw, 64px); font-weight: 900; color: #0F3F35; line-height: 1.06; letter-spacing: -1.5px; margin-bottom: 18px; }
        .lp-h1 span { color: #2F7F6D; }
        .lp-sub { font-size: clamp(14px, 2vw, 18px); color: #64748b; line-height: 1.7; max-width: 560px; margin: 0 auto 32px; font-weight: 300; }
        .lp-ctas { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .btn-cta { background: #0F3F35; color: white; font-size: 13px; font-weight: 700; padding: 14px 28px; border-radius: 14px; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 8px 24px -8px rgba(15,63,53,0.4); transition: background .2s, transform .15s, box-shadow .2s; }
        .btn-cta:hover { background: #2F7F6D; transform: translateY(-2px); box-shadow: 0 12px 32px -8px rgba(47,127,109,0.5); }
        .btn-cta-out { background: white; border: 1px solid #e2e8f0; font-size: 13px; font-weight: 700; color: #2B2E33; padding: 14px 28px; border-radius: 14px; cursor: pointer; transition: border-color .2s, background .2s; text-decoration: none; display: inline-flex; align-items: center; }
        .btn-cta-out:hover { border-color: #89C4AF; background: #EAF5F1; }

        .kb-wrap { max-width: 820px; margin: 48px auto 0; border-radius: 22px; border: 1px solid rgba(226,232,240,0.7); background: white; overflow: hidden; box-shadow: 0 24px 72px -16px rgba(0,0,0,0.13); }
        .kb-bar { background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 10px 14px; display: flex; align-items: center; gap: 10px; }
        .kb-dots { display: flex; gap: 5px; }
        .kb-dot { width: 11px; height: 11px; border-radius: 50%; background: #d4d4d8; }
        .kb-url { background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px 12px; font-size: 11px; color: #94a3b8; display: flex; align-items: center; gap: 5px; }
        .kb-body { display: flex; height: 200px; }
        .kb-sb { width: 48px; border-right: 1px solid #e2e8f0; display: flex; flex-direction: column; align-items: center; padding: 14px 0; gap: 12px; }
        .kb-sb-icon { width: 28px; height: 28px; background: #0F3F35; border-radius: 7px; display: flex; align-items: center; justify-content: center; }
        .kb-sb-box { width: 18px; height: 18px; border-radius: 4px; background: #f1f5f9; }
        .kb-cols { flex: 1; padding: 14px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; background: #f8fafc; overflow: hidden; }
        .kb-col-hd { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.7px; display: flex; align-items: center; gap: 5px; margin-bottom: 8px; }
        .kb-cdot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .kb-card { background: white; border-radius: 8px; border: 1px solid #e2e8f0; padding: 8px 10px; margin-bottom: 6px; }
        .kb-name { font-size: 11px; font-weight: 600; color: #2B2E33; }
        .kb-sub { font-size: 9px; color: #94a3b8; margin-top: 2px; }
        .kb-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2px; }
        .kb-badge { font-size: 8px; font-weight: 700; padding: 1px 5px; border-radius: 4px; }

        .lp-section { padding: clamp(40px, 6vw, 80px) clamp(20px, 5vw, 48px); max-width: 1100px; margin: 0 auto; }
        .lp-section-title { font-size: clamp(26px, 4vw, 48px); font-weight: 900; color: #0F3F35; letter-spacing: -1px; margin-bottom: 8px; }
        .lp-section-title span { color: #94a3b8; }
        .lp-section-sub { font-size: 15px; color: #64748b; font-weight: 300; line-height: 1.7; max-width: 560px; margin-bottom: 40px; }
        .lp-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 640px) { .lp-grid2 { grid-template-columns: 1fr; } }
        .card-dark { background: #0F3F35; border-radius: 28px; padding: clamp(28px, 4vw, 48px); min-height: 300px; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; }
        .card-dark::before { content: ''; position: absolute; right: -60px; top: -60px; width: 220px; height: 220px; border-radius: 50%; background: #2F7F6D; opacity: 0.25; filter: blur(40px); pointer-events: none; }
        .card-light { background: white; border: 1px solid #e2e8f0; border-radius: 28px; padding: clamp(28px, 4vw, 48px); min-height: 300px; display: flex; flex-direction: column; justify-content: space-between; }
        .card-icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 22px; margin-bottom: 20px; }
        .card-h { font-size: clamp(18px, 2.5vw, 24px); font-weight: 900; margin-bottom: 12px; }
        .card-p { font-size: 13px; line-height: 1.7; font-weight: 300; }

        .lp-steps-wrap { background: white; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; }
        .lp-steps { display: grid; grid-template-columns: repeat(4, 1fr); max-width: 1100px; margin: 0 auto; }
        @media (max-width: 768px) { .lp-steps { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 480px) { .lp-steps { grid-template-columns: 1fr; } }
        .lp-step { padding: 36px 24px; text-align: center; border-right: 1px solid #e2e8f0; }
        .lp-step:last-child { border-right: none; }
        .step-num { width: 48px; height: 48px; border-radius: 50%; border: 2px solid #e2e8f0; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 16px; font-weight: 900; color: #94a3b8; }
        .step-num.active { border-color: #0F3F35; color: #0F3F35; background: #EAF5F1; }
        .step-title { font-size: 14px; font-weight: 700; color: #2B2E33; margin-bottom: 6px; }
        .step-desc { font-size: 11px; color: #64748b; line-height: 1.6; }

        .lp-cta-sec { background: #0F3F35; padding: clamp(48px, 6vw, 80px) clamp(20px, 5vw, 48px); text-align: center; position: relative; overflow: hidden; }
        .lp-cta-sec::before { content: ''; position: absolute; right: -10%; top: -30%; width: 600px; height: 600px; border-radius: 50%; background: #2F7F6D; opacity: 0.12; filter: blur(80px); pointer-events: none; }
        .lp-cta-sec > * { position: relative; z-index: 1; }
        .lp-cta-h { font-size: clamp(26px, 4vw, 48px); font-weight: 900; color: white; letter-spacing: -1px; margin-bottom: 16px; }
        .lp-cta-h span { color: #89C4AF; }
        .lp-cta-sub { font-size: 15px; color: rgba(234,245,241,0.7); font-weight: 300; max-width: 480px; margin: 0 auto 32px; }
        .btn-hero { background: white; color: #0F3F35; font-size: 13px; font-weight: 900; padding: 16px 32px; border-radius: 14px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.2); transition: transform .15s, box-shadow .15s; text-transform: uppercase; letter-spacing: 0.5px; }
        .btn-hero:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(0,0,0,0.3); }

        .lp-footer { background: white; border-top: 1px solid #e2e8f0; padding: 28px; display: flex; align-items: center; justify-content: center; }
        .lp-footer-text { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #d4d4d8; }

        /* MODAL */
        .cf-overlay { position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.72); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: 16px; opacity: 0; pointer-events: none; transition: opacity 0.2s ease; }
        .cf-overlay.open { opacity: 1; pointer-events: all; }
        .cf-modal { background: #18181b; border: 1px solid #3f3f46; border-radius: 28px; padding: 32px; width: 100%; max-width: 380px; position: relative; transform: scale(0.93) translateY(12px); opacity: 0; transition: transform 0.25s cubic-bezier(.34,1.4,.64,1), opacity 0.2s ease; }
        .cf-overlay.open .cf-modal { transform: scale(1) translateY(0); opacity: 1; }
        .cf-close { position: absolute; top: -11px; right: -11px; width: 28px; height: 28px; border-radius: 50%; background: #3f3f46; border: 1px solid #52525b; color: #a1a1aa; font-size: 13px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background .15s, color .15s; line-height: 1; }
        .cf-close:hover { background: #52525b; color: white; }
        .cf-header { text-align: center; margin-bottom: 24px; }
        .cf-pill { display: inline-flex; align-items: center; justify-content: center; padding: 9px 16px; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2); border-radius: 14px; margin-bottom: 8px; }
        .cf-brand { font-size: 22px; font-weight: 900; color: white; letter-spacing: -0.5px; }
        .cf-brand em { color: #10b981; font-style: normal; }
        .cf-tagline { font-size: 11px; color: #71717a; }
        .cf-label { font-size: 9px; font-weight: 800; color: #52525b; text-transform: uppercase; letter-spacing: 2.5px; margin-bottom: 5px; display: block; }
        .cf-field { position: relative; margin-bottom: 14px; }
        .cf-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #52525b; font-size: 13px; pointer-events: none; }
        .cf-input { width: 100%; background: rgba(9,9,11,0.6); border: 1px solid #3f3f46; border-radius: 14px; padding: 12px 12px 12px 34px; font-size: 13px; color: white; font-family: inherit; outline: none; transition: border-color .2s, box-shadow .2s; }
        .cf-input::placeholder { color: #52525b; }
        .cf-input:focus { border-color: #10b981; box-shadow: 0 0 0 2.5px rgba(16,185,129,0.18); }
        .cf-error { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 12px; padding: 10px 12px; font-size: 11px; color: #f87171; font-weight: 500; margin-bottom: 14px; }
        .cf-submit { width: 100%; height: 46px; background: #10b981; border: none; border-radius: 14px; color: #022c22; font-size: 11px; font-weight: 900; letter-spacing: 1.8px; text-transform: uppercase; cursor: pointer; font-family: inherit; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background .2s, transform .1s; margin-top: 4px; }
        .cf-submit:hover:not(:disabled) { background: #34d399; }
        .cf-submit:active:not(:disabled) { transform: scale(0.98); }
        .cf-submit:disabled { background: #3f3f46; color: #71717a; cursor: default; }
        .cf-security { display: flex; align-items: center; justify-content: center; gap: 5px; margin-top: 16px; color: #3f3f46; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; }

        @keyframes cfPulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        @keyframes cfSpin { to { transform: rotate(360deg); } }
        .cf-spinner { width: 16px; height: 16px; border: 2px solid #3f3f46; border-top-color: #10b981; border-radius: 50%; animation: cfSpin .7s linear infinite; flex-shrink: 0; }
      `}</style>

      <div className="lp-root">
        {/* NAV */}
        <nav className="lp-nav">
          <a href="#" className="lp-logo">
            <div className="lp-logo-icon">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="lp-logo-text">CloseFit</span>
          </a>
          <div className="lp-nav-links">
            <a href="#solucao" className="lp-nav-link">A Solução</a>
            <a href="#fluxo" className="lp-nav-link">Como Funciona</a>
            <a href="#cta" className="lp-nav-link">Começar</a>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button className="btn-painel" onClick={() => setModalOpen(true)}>Acessar Painel</button>
            <button className="btn-diag" onClick={() => setModalOpen(true)}>Diagnóstico Grátis</button>
          </div>
        </nav>

        {/* HERO */}
        <section className="lp-hero">
          <div className="lp-badge">
            <div className="lp-badge-dot" />
            <span className="lp-badge-text">Foco Total em Fechamento</span>
          </div>
          <h1 className="lp-h1">A máquina de fechar<br /><span>matrículas da sua academia.</span></h1>
          <p className="lp-sub">Unifique o atendimento do seu WhatsApp, automatize o retorno em 5 minutos e pare de perder matrículas pro limbo.</p>
          <div className="lp-ctas">
            <button className="btn-cta" onClick={() => setModalOpen(true)}>
              Acessar o Painel
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </button>
            <a href="#solucao" className="btn-cta-out">Como funciona?</a>
          </div>

          {/* Kanban mockup */}
          <div className="kb-wrap">
            <div className="kb-bar">
              <div className="kb-dots"><div className="kb-dot" /><div className="kb-dot" /><div className="kb-dot" /></div>
              <div className="kb-url">🔒 closefit.com/sov/funil</div>
            </div>
            <div className="kb-body">
              <div className="kb-sb">
                <div className="kb-sb-icon">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13a2 2 0 012-2h3a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6zm0-8a2 2 0 012-2h3a2 2 0 012 2v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm11 0a2 2 0 012-2h3a2 2 0 012 2v3a2 2 0 01-2 2h-3a2 2 0 01-2-2V5zm0 9a2 2 0 012-2h3a2 2 0 012 2v5a2 2 0 01-2 2h-3a2 2 0 01-2-2v-5z" />
                  </svg>
                </div>
                <div className="kb-sb-box" /><div className="kb-sb-box" /><div className="kb-sb-box" />
              </div>
              <div className="kb-cols">
                <div>
                  <div className="kb-col-hd"><div className="kb-cdot" style={{ background: '#60a5fa' }} />Lead Novo (6)</div>
                  <div className="kb-card" style={{ borderLeft: '2.5px solid #60a5fa' }}>
                    <div className="kb-head"><span className="kb-name">Mateus Carvalho</span><span className="kb-badge" style={{ background: '#eff6ff', color: '#2563eb' }}>Meta</span></div>
                    <div className="kb-sub">⚡ Capturado há 1m</div>
                  </div>
                  <div className="kb-card"><div className="kb-name">Ana Júlia</div><div className="kb-sub">WhatsApp</div></div>
                </div>
                <div>
                  <div className="kb-col-hd"><div className="kb-cdot" style={{ background: '#fbbf24' }} />Negociação (2)</div>
                  <div className="kb-card" style={{ borderLeft: '2.5px solid #fbbf24' }}>
                    <div className="kb-head"><span className="kb-name">Ricardo Lima</span><span className="kb-badge" style={{ background: '#fef2f2', color: '#dc2626' }}>Atrasado</span></div>
                    <div className="kb-sub">Avaliação Agendada</div>
                  </div>
                </div>
                <div>
                  <div className="kb-col-hd"><div className="kb-cdot" style={{ background: '#2F7F6D' }} />Fechado ✓</div>
                  <div className="kb-card" style={{ background: '#EAF5F1', borderLeft: '2.5px solid #2F7F6D' }}>
                    <div className="kb-head"><span className="kb-name" style={{ color: '#0F3F35' }}>Sabrina Alves</span><span style={{ color: '#2F7F6D' }}>✓</span></div>
                    <div className="kb-sub" style={{ color: '#2F7F6D', fontWeight: 600 }}>Plano Anual Elite</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SOLUÇÃO */}
        <section id="solucao" className="lp-section">
          <h2 className="lp-section-title">O fim do <span>vazamento comercial.</span></h2>
          <p className="lp-section-sub">O CloseFit protege quem ainda não comprou — impedindo que o seu maior patrimônio (o lead) se perca em celulares pessoais da equipe.</p>
          <div className="lp-grid2">
            <div className="card-dark">
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div className="card-icon" style={{ background: 'rgba(255,255,255,0.08)' }}>💬</div>
                <h3 className="card-h" style={{ color: 'white' }}>WhatsApp Station Hub</h3>
                <p className="card-p" style={{ color: 'rgba(234,245,241,0.8)' }}>Unifique o atendimento comercial em um único número oficial. Transmita autoridade institucional enquanto audita em tempo real cada palavra dita aos seus futuros alunos.</p>
              </div>
              <div style={{ position: 'relative', zIndex: 1, marginTop: 28, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ fontSize: 10, fontWeight: 900, color: '#89C4AF', textTransform: 'uppercase', letterSpacing: '0.25em' }}>Vantagem CloseFit ✓</span>
              </div>
            </div>
            <div className="card-light">
              <div>
                <div className="card-icon" style={{ background: '#f8fafc' }}>⚠️</div>
                <h3 className="card-h" style={{ color: '#2B2E33' }}>O Perigo do Modelo Antigo</h3>
                <p className="card-p" style={{ color: '#64748b' }}>Vendedores usando WhatsApp pessoal criam caixas pretas. Se o funcionário sai, o histórico e o contato do aluno saem pela porta com ele.</p>
              </div>
              <div style={{ marginTop: 28, paddingTop: 18, borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'cfPulse 2s ease-in-out infinite' }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Risco de Perda de Ativo</span>
              </div>
            </div>
          </div>
        </section>

        {/* FLUXO */}
        <section id="fluxo" className="lp-steps-wrap">
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px clamp(20px, 5vw, 48px) 0', textAlign: 'center' }}>
            <div style={{ display: 'inline-block', background: '#f1f5f9', borderRadius: 50, padding: '4px 14px', fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 16 }}>A Anatomia do Fluxo</div>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 42px)', fontWeight: 900, color: '#2B2E33', letterSpacing: -0.5, marginBottom: 48 }}>
              Do clique do anúncio <span style={{ color: '#2F7F6D' }}>ao cartão de crédito.</span>
            </h2>
          </div>
          <div className="lp-steps">
            {[
              { n: '01', title: 'Captura Automática', desc: 'Leads caem no funil do Instagram, Meta Ads ou Landing Pages.' },
              { n: '02', title: 'Triagem Imediata', desc: 'A janela de calor (5 min) é atacada com respostas automáticas.' },
              { n: '03', title: 'Garantia de Presença', desc: 'Protocolo de lembretes que garantem o aluno na sua porta.' },
              { n: '04', title: 'Matrícula Híbrida', desc: 'Link de pagamento direto no chat para finalizar sem atritos.', active: true },
            ].map(s => (
              <div key={s.n} className="lp-step">
                <div className={`step-num${s.active ? ' active' : ''}`}>{s.n}</div>
                <div className="step-title">{s.title}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA FINAL */}
        <section id="cta" className="lp-cta-sec">
          <h2 className="lp-cta-h">Ativo Protegido:<br /><span>Seus clientes nunca mais saem pela porta.</span></h2>
          <p className="lp-cta-sub">Resgatando apenas uma fração mínima do que você já perde hoje no fluxo manual, o sistema sai virtualmente gratuito.</p>
          <button className="btn-hero" onClick={() => setModalOpen(true)}>
            Entrar no Painel
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </button>
        </section>

        {/* FOOTER */}
        <footer className="lp-footer">
          <span className="lp-footer-text">A Máquina de Vendas Para Academias © {new Date().getFullYear()}</span>
        </footer>
      </div>

      {/* MODAL */}
      <div
        className={`cf-overlay${modalOpen ? ' open' : ''}`}
        onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
      >
        <div className="cf-modal">
          <button className="cf-close" onClick={closeModal}>✕</button>
          <div className="cf-header">
            <div className="cf-pill"><span className="cf-brand">Close<em>Fit</em></span></div>
            <p className="cf-tagline">Acesse o painel da sua academia</p>
          </div>
          <form onSubmit={handleLogin}>
            {error && <div className="cf-error">❌ {error}</div>}
            <label className="cf-label">Usuário</label>
            <div className="cf-field">
              <span className="cf-icon">👤</span>
              <input className="cf-input" type="text" placeholder="Ex: jordancoliseu" value={username} onChange={e => setUsername(e.target.value)} required autoFocus autoComplete="username" disabled={loading} />
            </div>
            <label className="cf-label">Senha</label>
            <div className="cf-field">
              <span className="cf-icon">🔒</span>
              <input className="cf-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" disabled={loading} />
            </div>
            <button className="cf-submit" type="submit" disabled={loading || !username.trim() || !password}>
              {loading
                ? <><div className="cf-spinner" />Entrando...</>
                : <>🏛️ Entrar no Sistema <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg></>
              }
            </button>
          </form>
          <div className="cf-security">
            <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
            Sessão Segura e Criptografada
          </div>
        </div>
      </div>
    </>
  );
}

# 🏛️ Coliseu Academia

Sistema de gestão da Coliseu Academia (Teixeira de Freitas - BA) com:

- 🤖 **Atena** — IA atendente do WhatsApp (Claude Haiku 4.5)
- 💬 Caixa de conversas estilo Chatwoot
- 🔥 Caixa de Fechamento (leads prontos pra fechar venda)
- 🏃 Funil de Leads
- 🗓️ Agenda de aulas (experimentais e regulares)
- 👥 Cadastro de alunos
- 👨‍🏫 Cadastro de professores (com cálculo de hora)
- 🔔 Notificações pro supervisor
- 🔐 **Login Magic Link via Supabase** (sem senha, sem cartão)
- 🎤 Transcrição de áudio (OpenAI Whisper)

## 🛠️ Stack

- **Next.js 14** + TypeScript
- **Prisma** + PostgreSQL (no Railway)
- **Supabase Auth** (Magic Link, sem senha)
- **Anthropic Claude Haiku 4.5**
- **OpenAI Whisper** (áudio → texto)
- **Evolution API** (WhatsApp)
- Hospedagem: **Railway**

## 🚀 Deploy rápido

Veja **PASSO_A_PASSO.md** com o passo a passo completo de subida.

## 🎭 Como funciona a Atena

A Atena é uma atendente profissional (não motivacional). Ela:

1. ✅ Identifica se o número é **lead** ou **aluno cadastrado**
2. ✅ Para **leads**: qualifica → oferece aula experimental → quando perguntam preço, pergunta modalidade → manda foto dos planos → pergunta forma de pagamento → manda pra Caixa de Fechamento
3. ✅ Para **alunos**: NÃO responde nada — escala direto pro humano
4. ✅ Transcreve áudio (Whisper)
5. ✅ Nunca fecha venda sozinha — sempre passa pro humano

## 🔐 Autenticação

- Login com **Magic Link** (digita email → recebe link → clica → entra)
- 2 níveis: **Admin** + **Professor**
- Admins definidos por env var `ADMIN_EMAILS`
- Professores são cadastrados pelo painel (recebem email de convite automático)

## 📞 Contatos

- Owner: Tawan
- Local: Teixeira de Freitas - BA
- Horário: Seg-Sáb, 8h às 21h

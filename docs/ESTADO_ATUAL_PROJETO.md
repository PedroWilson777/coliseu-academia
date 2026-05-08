# Coliseu Academia - Documentação e Estado Atual

## 🎯 Objetivo Principal
Sistema de gestão da "Coliseu Academia" com integração no WhatsApp via Evolution API, inteligência artificial Atena (Claude) para qualificação de leads, e um painel de controle feito em Next.js para acompanhamento.

## ⚙️ Stack Tecnológica
- **Framework:** Next.js 14
- **Banco de Dados:** Prisma ORM com PostgreSQL (atualmente no Railway, migrando para Supabase).
- **Autenticação:** Migrando de NextAuth (Email/Senha) para **Supabase Auth (Magic Link OTP)**.
- **WhatsApp:** Evolution API.
- **Inteligência Artificial:** Anthropic Claude (Modelo: `claude-haiku`).
- **Transcrição de Áudio:** OpenAI Whisper.

## 🚀 O que já foi feito?

1. **Painel Base e Layout:**
   - Telas de Dashboard, Alunos, Leads, Professores, Agenda, e Supervisor prontas.
   - Design mode implementado em `globals.css` e `tailwind.config.ts`.
   
2. **Integração WhatsApp + Atena (IA):**
   - Webhook configurado em `src/app/api/webhook/evolution/route.ts` para receber mensagens via Evolution API.
   - Identificação automática (`src/lib/identity.ts`) para separar se quem chama é **Aluno Cadastrado** ou **Lead Novo**.
   - **Regra de Negócio Implementada:** Atena *não* responde alunos (apenas envia aviso pro painel humano), mas qualifica Leads Novos com base nas modalidades (Pilates, Musculação, CrossTraining) usando as META Tags do Claude (`src/lib/meta-handler.ts`).

3. **Início da Migração para Supabase:**
   - Foram criados os clientes do Supabase (`supabase-client.ts` e `supabase-server.ts`).
   - O middleware (`middleware.ts`) já está configurado para gerenciar os cookies do Supabase.
   - A tela de Login (`src/app/login/page.tsx`) foi refatorada para solicitar o Magic Link via Email usando o OTP do Supabase.
   - Prisma Schema (`schema.prisma`) foi atualizado para referenciar o `supabaseId`.

## 🚧 Próximos Passos Imediatos (Pendente)

Para finalizarmos a migração pro Supabase e o sistema poder ser testado 100%:

1. **Pegar as chaves de API no Supabase:**
   - Fomos até o painel (`https://supabase.com/dashboard/project/qjhlggvxivslkcnzeppp`).
   - Precisamos colocar no arquivo `.env`:
     - `NEXT_PUBLIC_SUPABASE_URL="https://qjhlggvxivslkcnzeppp.supabase.co"`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY="..."`
     - `SUPABASE_SERVICE_ROLE_KEY="..."`
     - `DATABASE_URL="..."` (Connection string URI do banco do Supabase).

2. **Gerar e aplicar o banco de dados:**
   - Rodar `npx prisma db push` ou migrações após setar o `DATABASE_URL` do Supabase.

3. **Testar Autenticação e Webhook:**
   - Tentar fazer o login via e-mail.
   - Simular o recebimento de mensagem da Evolution API.

---

> **Aviso para o Agente de IA:** Ao ler este documento, assuma imediatamente o contexto para finalizar a migração do Supabase e configurar as chaves.

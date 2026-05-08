# 🏛️ COLISEU ACADEMIA — Passo a passo de subida

> **Sistema com login Magic Link via Supabase (sem cartão de crédito).**
>
> Tu vai usar o mesmo número WhatsApp da Galego pra testar, então no final tu desconecta a Galego e conecta no Coliseu.
> **Lê tudo até o fim antes de começar.**

---

## ✅ ANTES DE COMEÇAR

Tu vai precisar de:

- 🔑 Conta **GitHub** (a mesma da Galego: `pedrowicloud@gmail.com`)
- 🔑 Conta **Railway** (a mesma)
- 🔑 Chave **Anthropic** (tu já tem)
- 🔑 Chave **OpenAI** (tu já tem)
- 🔑 Acesso à **Evolution API** (mesma da Galego)
- 🆕 Conta **Supabase** (vai criar agora — é grátis e sem cartão)

---

## 🪜 PARTE 1 — Subir o código no GitHub

### 1.1 Criar o repositório

1. Vai em [github.com/new](https://github.com/new)
2. **Nome do repo:** `coliseu-academia`
3. **Privado** (pra não vazar código)
4. **NÃO** marque "Add README"
5. Clica em **Create repository**

### 1.2 Subir os arquivos

1. **Extrai o ZIP** que eu te mandei (`coliseu-academia.zip`) em alguma pasta do computador
2. No GitHub, clica em **"uploading an existing file"** (link na página do repo vazio)
3. **Arrasta TODOS os arquivos** da pasta extraída pra dentro do GitHub (incluindo as pastas `src`, `prisma`, `public`)
4. Lá embaixo, em **commit message**, escreve: `Initial commit`
5. Clica em **Commit changes**

⏱️ Espera 1-2 minutos pra subir tudo.

---

## 🪜 PARTE 2 — Configurar Supabase (login Magic Link)

> **Não precisa de cartão.** É 100% grátis até 50.000 usuários ativos por mês.

### 2.1 Criar conta no Supabase

1. Vai em [supabase.com](https://supabase.com)
2. Clica em **Start your project**
3. Loga com tua conta do GitHub (mais rápido)
4. Aceita os termos

### 2.2 Criar projeto

1. Clica em **+ New project**
2. **Organization:** deixa o padrão (vai aparecer com teu nome)
3. **Project name:** `coliseu-academia`
4. **Database Password:** clica em **Generate a password** e **GUARDA ESSA SENHA** (não vamos usar, mas é bom guardar)
5. **Region:** `South America (São Paulo)` 🇧🇷
6. **Plan:** Free
7. Clica **Create new project**

⏱️ Espera ~2 minutos enquanto cria.

### 2.3 Pegar as credenciais

Quando o projeto estiver pronto:

1. No menu lateral → ⚙️ **Project Settings**
2. Aba **API**
3. **Vai te aparecer 3 valores importantes:**

| Nome | Onde tá | Pra que serve |
|------|---------|---------------|
| **Project URL** | em "Project URL" | URL do teu Supabase |
| **anon public** | em "Project API keys" → primeira chave | Chave pública (frontend) |
| **service_role secret** | em "Project API keys" → segunda chave (clica em "Reveal" pra ver) | Chave admin (backend) |

📋 **Copia os 3 valores num bloco de notas.** Vai precisar logo.

### 2.4 Ativar Magic Link

1. Menu lateral → 🔐 **Authentication**
2. Aba **Providers**
3. Verifica que **Email** tá ativado (deve estar por padrão)
4. Clica em **Email** pra abrir as configurações
5. **Confirme que está ATIVO:**
   - ✅ Enable Email Provider: **ON**
   - ✅ Confirm Email: **OFF** *(IMPORTANTE: deixa OFF pra não precisar confirmar email a cada login)*
   - ✅ Secure Email Change: **ON**
   - ✅ Enable Sign Ups: **ON**
6. Salva

### 2.5 Configurar URL de redirecionamento

> Vai voltar aqui depois quando tiver o domínio Railway, mas já fica anotado.

Por enquanto, pula.

---

## 🪜 PARTE 3 — Subir no Railway

### 3.1 Criar projeto

1. Vai em [railway.app](https://railway.app/)
2. Clica em **+ New Project**
3. **Deploy from GitHub repo**
4. Seleciona `coliseu-academia`
5. Clica **Deploy Now**

⏱️ Vai começar a fazer build. Vai dar erro (tá normal!) — ainda falta configurar.

### 3.2 Adicionar PostgreSQL

1. No projeto Railway → **+ Create**
2. Seleciona **Database** → **Add PostgreSQL**
3. Espera criar (~30 segundos)

### 3.3 Configurar variáveis de ambiente

Clica no serviço **coliseu-academia** (não no Postgres) → aba **Variables**.

Adiciona TODAS essas variáveis (clica **+ New Variable** uma por uma):

| Variável | Valor |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` *(literal, com chaves duplas)* |
| `ANTHROPIC_API_KEY` | tua chave Anthropic (`sk-ant-...`) |
| `ANTHROPIC_MODEL` | `claude-haiku-4-5-20251001` |
| `OPENAI_API_KEY` | tua chave OpenAI (`sk-...`) |
| `EVOLUTION_API_URL` | `https://evolution-evolution-api.eeb1ij.easypanel.host` |
| `EVOLUTION_API_KEY` | mesma chave da Galego |
| `EVOLUTION_INSTANCE` | `coliseu` *(IMPORTANTE: minúsculo, sem acento)* |
| `NEXT_PUBLIC_SUPABASE_URL` | a **Project URL** que tu copiou no passo 2.3 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | a chave **anon public** do passo 2.3 |
| `SUPABASE_SERVICE_ROLE_KEY` | a chave **service_role secret** do passo 2.3 |
| `ADMIN_EMAILS` | `pedrowicloud@gmail.com,coliseutx@gmail.com` |

### 3.4 Configurar Build & Start commands

Ainda no serviço **coliseu-academia**, vai em **Settings**:

- **Build Command:** `next build`
- **Start Command:** `npx prisma migrate deploy && npx prisma db seed && npm start`

### 3.5 Gerar domínio público

Ainda em **Settings** → **Networking** → **Generate Domain**

Vai aparecer algo tipo: `coliseu-academia-production-abc.up.railway.app`

📋 **Anota esse domínio.** Vai usar agora.

### 3.6 Adicionar mais 1 variável usando o domínio

Volta na aba **Variables** e adiciona:

| Variável | Valor |
|---|---|
| `APP_URL` | `https://coliseu-academia-production-abc.up.railway.app` *(o domínio que tu acabou de gerar)* |

### 3.7 Voltar no Supabase e configurar URL de redirecionamento

1. Volta em [supabase.com/dashboard](https://supabase.com/dashboard)
2. Abre teu projeto `coliseu-academia`
3. Menu lateral → 🔐 **Authentication**
4. Aba **URL Configuration**
5. **Site URL:** cola o domínio do Railway:
   ```
   https://coliseu-academia-production-abc.up.railway.app
   ```
6. **Redirect URLs:** clica em **Add URL** e adiciona:
   ```
   https://coliseu-academia-production-abc.up.railway.app/auth/callback
   ```
7. Clica **Save**

### 3.8 Redeploy

No Railway → menu de 3 pontinhos do serviço `coliseu-academia` → **Restart** ou **Redeploy**.

⏱️ Espera ~3 minutos. Quando ficar verde, abre o domínio no navegador.

---

## 🪜 PARTE 4 — Primeiro acesso

1. Abre `https://teu-dominio.up.railway.app/login`
2. Digita teu email: `pedrowicloud@gmail.com`
3. Clica em **📧 Receber link de acesso**
4. **Vai no Gmail** → tu vai receber um email do Supabase
5. Clica no link **"Log In"** dentro do email
6. Vai cair direto no painel ✅

🎉 Se chegou aqui, a parte mais difícil ACABOU.

### Se não receber o email:
- ⏱️ Espera 1-2 minutos
- 📁 Olha na pasta **Spam/Lixo eletrônico**
- 🔄 Tenta de novo
- Se ainda não chegar, vai no Supabase → **Authentication** → **Logs** pra ver se foi enviado

---

## 🪜 PARTE 5 — Configurar webhook do WhatsApp

> Aqui é a parte de conectar o WhatsApp com o sistema. **Importante: a Galego vai parar de responder durante o teste do Coliseu.**

### 5.1 Desconectar a instância da Galego

1. Vai no Evolution Manager: `https://evolution-evolution-api.eeb1ij.easypanel.host/manager`
2. Acha a instância `teste` (essa é a da Galego)
3. Clica em **Logout** ou **Disconnect**

### 5.2 Criar nova instância `coliseu`

1. Clica **Create Instance**
2. **Instance Name:** `coliseu`
3. **Apikey:** mesma chave que tu usou no Railway (variável `EVOLUTION_API_KEY`)
4. Clica **Create**

### 5.3 Conectar o WhatsApp

1. Clica na instância `coliseu` recém-criada
2. Clica em **QR Code**
3. Pega o celular com o número da Galego (mesmo número!)
4. WhatsApp → Configurações → Aparelhos conectados → Conectar aparelho
5. **Escaneia o QR Code**
6. Espera ficar verde ✅

### 5.4 Configurar o webhook

Ainda na instância `coliseu`:

1. Clica em **Webhook** ou **Settings**
2. **Webhook URL:**
   ```
   https://teu-dominio.up.railway.app/api/webhook/evolution
   ```
3. **Events:** marca apenas `MESSAGES_UPSERT`
4. Salva

---

## 🪜 PARTE 6 — Testar!

Pega outro celular (não o do número conectado) e manda **"oi"** pro número da Coliseu.

### O que deve acontecer:
1. ⏱️ ~2-5 segundos
2. 🤖 Atena responde: *"Olá! 👋 Sou a Atena, da Coliseu Academia. Como posso te chamar?"*
3. Tu manda teu nome: "Pedro"
4. Atena: *"Prazer, Pedro! Em que posso te ajudar..."*
5. Tu pergunta sobre preço
6. Atena pergunta a modalidade
7. Tu fala "Cross"
8. **Atena manda a foto do CrossTraining + pergunta qual plano**
9. Tu escolhe um plano
10. Atena pergunta forma de pagamento
11. Tu fala "PIX"
12. **Atena passa pra Caixa de Fechamento + avisa que o Tawan vai chamar**

### No painel:
- Vai em `/chat` → vai ver a conversa
- Vai em `/fechamento` → o lead deve estar lá 🔥
- Vai em `/leads` → vê no funil

---

## 🪜 PARTE 7 — Cadastrar professores

> ⚠️ Importante: quando tu cadastra um professor pelo painel, ele recebe um email AUTOMÁTICO com link de acesso.

1. No painel → **Professores** → **+ Novo professor**
2. Pra cada um, preenche:
   - **Nome**
   - **Email** (Gmail dele)
   - **Modalidades** (Pilates, Musculação, CrossTraining)
   - **Valor/hora**
3. **Tawan**: marca como **"É dono"** (não recebe valor/hora, recebe pró-labore)
4. O professor recebe um email com link "Confirma teu acesso"
5. Quando ele clicar, ele entra no sistema com permissão de Professor

---

## 🪜 PARTE 8 — Cadastrar alunos (quando tu tiver a planilha)

1. No painel → **Alunos** → **+ Novo aluno**
2. Pra cada um, preenche nome, telefone (com 55), modalidade, plano

---

## 🚨 PROBLEMAS COMUNS

### ❌ "Acesso pendente" depois do login

Tu logou com um email que não tá em `ADMIN_EMAILS`. Adiciona o email lá no Railway → Variables.

### ❌ Email com link não chega

1. Verifica caixa de spam
2. Vai no Supabase → **Authentication** → **Logs** pra ver se foi enviado
3. Verifica se as 3 variáveis do Supabase estão certas no Railway

### ❌ Erro "redirect_to is not in allowlist"

Tu não configurou a URL de redirecionamento no Supabase (PARTE 3.7). Volta lá.

### ❌ Atena não responde no WhatsApp

1. Verifica se o webhook tá configurado certo (PARTE 5.4)
2. Verifica se `EVOLUTION_INSTANCE=coliseu` no Railway
3. Verifica logs do Railway pra ver se chegou alguma requisição

### ❌ Imagens dos planos não chegam

A URL `https://teu-dominio.up.railway.app/planos/crosstraining.jpeg` precisa estar acessível. Testa no navegador. Se não abrir, é erro de deploy.

---

## 🔄 VOLTAR PRA GALEGO

Quando quiser que a Galego volte a funcionar:

1. Evolution Manager → instância `coliseu` → **Logout**
2. Evolution Manager → instância `teste` → **QR Code** → escaneia de novo
3. Pronto, Sofia volta a responder.

---

## 📞 PRECISA DE AJUDA?

Manda print do erro pra mim que eu te ajudo na hora.

🏛️ **Coliseu Academia · Teixeira de Freitas - BA**

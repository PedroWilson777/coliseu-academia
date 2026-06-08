// Script ONE-TIME: cria/atualiza usuários no Supabase Auth com senhas fixas
// Rode com: node seed-supabase.mjs

const SUPABASE_URL = 'https://qjhlggvxivslkcnzeppp.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqaGxnZ3Z4aXZzbGtjbnplcHBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODA5NzkxMywiZXhwIjoyMDkzNjczOTEzfQ.FZUVvMJyIA-U_uDgTBWAUly8Kl1e4GtdckNmuNJWVA8';

const USERS = [
  // Professores — senha: coliseu2026
  { email: 'jordancoliseu@closefit.com',   name: 'Professor Jordan',   password: 'coliseu2026', role: 'TEACHER' },
  { email: 'leticiacoliseu@closefit.com',  name: 'Professora Letícia', password: 'coliseu2026', role: 'TEACHER' },
  { email: 'laiscoliseu@closefit.com',     name: 'Professora Laís',    password: 'coliseu2026', role: 'TEACHER' },
  { email: 'lucascoliseu@closefit.com',    name: 'Professor Lucas',    password: 'coliseu2026', role: 'TEACHER' },
  { email: 'tauancoliseu@closefit.com',    name: 'Professor Tauan',    password: 'coliseu2026', role: 'TEACHER' },
  { email: 'brunessacoliseu@closefit.com', name: 'Fisio Brunessa',     password: 'coliseu2026', role: 'TEACHER' },
  { email: 'carolinacoliseu@closefit.com', name: 'Fisio Carolina',     password: 'coliseu2026', role: 'TEACHER' },
  // Admins — senha: adm00
  { email: 'pedrowicloud@gmail.com',       name: 'Pedro',              password: 'adm00',       role: 'ADMIN' },
  { email: 'coliseutx@gmail.com',          name: 'Coliseu Admin',      password: 'adm00',       role: 'ADMIN' },
];

async function listUsers() {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=1000`, {
    headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, apikey: SERVICE_ROLE_KEY },
  });
  const data = await res.json();
  return data.users || [];
}

async function createUser(email, password, name, role) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { name, role } }),
  });
  return res.json();
}

async function updatePassword(userId, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password }),
  });
  return res.json();
}

async function run() {
  console.log('🔐 Conectando ao Supabase...\n');
  const existing = await listUsers();
  const byEmail = Object.fromEntries(existing.map(u => [u.email, u]));

  for (const u of USERS) {
    if (byEmail[u.email]) {
      await updatePassword(byEmail[u.email].id, u.password);
      console.log(`✅ ${u.email} — senha atualizada para: ${u.password}`);
    } else {
      const result = await createUser(u.email, u.password, u.name, u.role);
      if (result.email) {
        console.log(`🆕 ${u.email} — criado com senha: ${u.password}`);
      } else {
        console.log(`❌ ${u.email} — erro:`, JSON.stringify(result));
      }
    }
  }

  console.log('\n✅ Concluído!');
}

run().catch(console.error);

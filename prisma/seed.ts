import { PrismaClient, Modality } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🏛️  Populando banco da Coliseu Academia...');

  // ===== PLANOS =====
  const plans = [
    // PILATES
    { modality: 'PILATES' as Modality, name: 'Smart', frequency: '2x/semana', priceInCents: 24900, durationMonths: 1, features: ['Sessões em Aparelhos', 'Sem permanência mínima', 'Sessões agendadas'] },
    { modality: 'PILATES' as Modality, name: 'Smart', frequency: '3x/semana', priceInCents: 28900, durationMonths: 1, features: ['Sessões em Aparelhos', 'Sem permanência mínima', 'Sessões agendadas'] },
    { modality: 'PILATES' as Modality, name: 'Elite', frequency: '2x/semana', priceInCents: 19900, durationMonths: 12, features: ['Sessões em Aparelhos', 'Não ocupa limite do cartão', 'Proteção contra Aumento', 'Acesso ao Coliseu Clube'] },
    { modality: 'PILATES' as Modality, name: 'Elite', frequency: '3x/semana', priceInCents: 25900, durationMonths: 12, features: ['Sessões em Aparelhos', 'Não ocupa limite do cartão', 'Proteção contra Aumento', 'Acesso ao Coliseu Clube'] },
    { modality: 'PILATES' as Modality, name: 'Flex', frequency: '2x/semana', priceInCents: 21900, durationMonths: 1, features: ['Sessões em Aparelhos', 'Sem permanência mínima', 'Recorrência (Não ocupa limite)', 'Acesso ao Coliseu Clube'] },
    { modality: 'PILATES' as Modality, name: 'Flex', frequency: '3x/semana', priceInCents: 26900, durationMonths: 1, features: ['Sessões em Aparelhos', 'Sem permanência mínima', 'Recorrência (Não ocupa limite)', 'Acesso ao Coliseu Clube'] },

    // MUSCULAÇÃO
    { modality: 'MUSCULACAO' as Modality, name: 'Smart', frequency: '2x/semana', priceInCents: 44900, durationMonths: 1, features: ['Máx. 2 alunos por Personal', 'Acompanhamento Individual', 'Avaliação Física inclusa', 'Sem permanência mínima', 'Sessões agendadas'] },
    { modality: 'MUSCULACAO' as Modality, name: 'Smart', frequency: '3x/semana', priceInCents: 54900, durationMonths: 1, features: ['Máx. 2 alunos por Personal', 'Acompanhamento Individual', 'Avaliação Física inclusa', 'Sem permanência mínima', 'Sessões agendadas'] },
    { modality: 'MUSCULACAO' as Modality, name: 'Smart', frequency: '5x/semana', priceInCents: 69900, durationMonths: 1, features: ['Máx. 2 alunos por Personal', 'Acompanhamento Individual', 'Avaliação Física inclusa', 'Sem permanência mínima', 'Sessões agendadas'] },
    { modality: 'MUSCULACAO' as Modality, name: 'Elite', frequency: '2x/semana', priceInCents: 34900, durationMonths: 12, features: ['Máx. 2 alunos por Personal', 'Acompanhamento Individual', 'Avaliação Física inclusa', 'Não ocupa limite do cartão', 'Acesso ao Coliseu Clube'] },
    { modality: 'MUSCULACAO' as Modality, name: 'Elite', frequency: '3x/semana', priceInCents: 44900, durationMonths: 12, features: ['Máx. 2 alunos por Personal', 'Acompanhamento Individual', 'Avaliação Física inclusa', 'Não ocupa limite do cartão', 'Acesso ao Coliseu Clube'] },
    { modality: 'MUSCULACAO' as Modality, name: 'Elite', frequency: '5x/semana', priceInCents: 59900, durationMonths: 12, features: ['Máx. 2 alunos por Personal', 'Acompanhamento Individual', 'Avaliação Física inclusa', 'Não ocupa limite do cartão', 'Acesso ao Coliseu Clube'] },
    { modality: 'MUSCULACAO' as Modality, name: 'Flex', frequency: '2x/semana', priceInCents: 39900, durationMonths: 1, features: ['Máx. 2 alunos por Personal', 'Acompanhamento Individual', 'Sem permanência mínima', 'Avaliação Física inclusa', 'Acesso ao Coliseu Clube'] },
    { modality: 'MUSCULACAO' as Modality, name: 'Flex', frequency: '3x/semana', priceInCents: 49900, durationMonths: 1, features: ['Máx. 2 alunos por Personal', 'Acompanhamento Individual', 'Sem permanência mínima', 'Avaliação Física inclusa', 'Acesso ao Coliseu Clube'] },
    { modality: 'MUSCULACAO' as Modality, name: 'Flex', frequency: '5x/semana', priceInCents: 64900, durationMonths: 1, features: ['Máx. 2 alunos por Personal', 'Acompanhamento Individual', 'Sem permanência mínima', 'Avaliação Física inclusa', 'Acesso ao Coliseu Clube'] },

    // CROSSTRAINING (1 plano por categoria)
    { modality: 'CROSSTRAINING' as Modality, name: 'Smart', frequency: 'mensal avulso', priceInCents: 26900, durationMonths: 1, features: ['Acompanhamento Individual', 'Avaliação Física inclusa', 'Sem permanência mínima', 'Treine todos os dias'] },
    { modality: 'CROSSTRAINING' as Modality, name: 'Elite', frequency: '12 meses', priceInCents: 20900, durationMonths: 12, features: ['Acompanhamento Individual', 'Avaliação Física inclusa', 'Não ocupa limite do cartão', 'Treine todos os dias', 'Acesso ao Coliseu Clube', 'Desconto em outras modalidades'] },
    { modality: 'CROSSTRAINING' as Modality, name: 'Flex', frequency: 'recorrência mensal', priceInCents: 23900, durationMonths: 1, features: ['Acompanhamento Individual', 'Avaliação Física inclusa', 'Sem permanência mínima', 'Treine todos os dias', 'Acesso ao Coliseu Clube'] },
  ];

  for (const p of plans) {
    await prisma.plan.upsert({
      where: { modality_name_frequency: { modality: p.modality, name: p.name, frequency: p.frequency } },
      update: { priceInCents: p.priceInCents, features: p.features, durationMonths: p.durationMonths, active: true },
      create: p,
    });
  }
  console.log(`💎 ${plans.length} planos cadastrados`);

  // ===== CONFIGURAÇÕES =====h
  const settings = [
    { key: 'shop_name',         value: 'Coliseu Academia' },
    { key: 'shop_address',      value: 'Av. Padre Anchieta, 367 - Jardim Caraipe, Teixeira de Freitas - BA, 45998-002' },
    { key: 'shop_hours',        value: 'Segunda a Sábado, 5h às 22h' },
    { key: 'payment_methods',   value: 'PIX, cartão de crédito, débito, dinheiro e boleto' },
    { key: 'capacity_pilates',       value: '4' },
    { key: 'capacity_musculacao',    value: '2' },
    { key: 'capacity_crosstraining', value: '22' },
    { key: 'experimental_active',    value: 'true' },
    { key: 'ai_active',              value: 'true' },
  ];

  for (const s of settings) {
    await prisma.settings.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }
  console.log(`⚙️  ${settings.length} configurações salvas`);

  console.log('\n✅ Banco populado com sucesso!\n');
  console.log('📌 Próximos passos:');
  console.log('  1. Faça login com Google em pedrowicloud@gmail.com ou coliseutx@gmail.com');
  console.log('  2. Cadastre os professores no painel /professores');
  console.log('  3. Cadastre os alunos no painel /alunos\n');
}

main()
  .catch((e) => { console.error('❌', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

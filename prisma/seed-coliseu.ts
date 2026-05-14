// Seed inicial da Coliseu Academia
// Popula Settings, Planos e Funnel Stages com dados reais
//
// Como rodar (via Railway Start Command, uma vez):
//   npx prisma db push --skip-generate && npx tsx prisma/seed-coliseu.ts && npm start
//
// Depois de rodar com sucesso UMA VEZ, volta o Start Command pra:
//   npx prisma db push --skip-generate && npm start

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('⚡ Iniciando seed Coliseu Academia...\n');

  console.log('Settings...');
    const settings = [
      { key: 'shop_name', value: 'Coliseu Academia' },
      { key: 'shop_address', value: 'Av. Padre Anchieta, 367 - Jardim Caraipe, Teixeira de Freitas - BA, 45998-002' },
      { key: 'shop_hours', value: 'Segunda a Sabado, das 5h as 22h' },
      { key: 'payment_methods', value: 'PIX, cartao de credito, cartao de debito, dinheiro e boleto' },
      { key: 'capacity_pilates', value: '4' },
      { key: 'capacity_musculacao', value: '2' },
      { key: 'capacity_crosstraining', value: '22' },
        ];
    for (const s of settings) {
          await prisma.settings.upsert({ where: { key: s.key }, update: { value: s.value }, create: { key: s.key, value: s.value } });
          console.log('   OK ' + s.key);
    }

  console.log('\nFunnel Stages...');
    const stages = [
      { name: 'Novos', slug: 'NEW', order: 1, color: '#3b82f6' },
      { name: 'Qualificados', slug: 'QUALIFIED', order: 2, color: '#3b82f6' },
      { name: 'Experimental', slug: 'EXPERIMENTAL', order: 3, color: '#eab308' },
      { name: 'Fechamento', slug: 'CLOSING', order: 4, color: '#f97316' },
      { name: 'Ganhos', slug: 'WON', order: 5, color: '#22c55e' },
      { name: 'Perdidos', slug: 'LOST', order: 6, color: '#ef4444' },
        ];
    for (const st of stages) {
          try {
                  await (prisma as any).funnelStage.upsert({ where: { slug: st.slug }, update: { name: st.name, order: st.order, color: st.color }, create: st });
                  console.log('   OK ' + st.name);
          } catch (e) {
                  console.log('   skip ' + st.name + ' (FunnelStage table may not exist)');
                  break;
          }
    }

  console.log('\nPlanos...');
    await prisma.plan.deleteMany({});
    const plans = [
      { modality: 'PILATES', name: 'SMART', frequency: '2x/semana', priceInCents: 24900, active: true, description: 'Mensal avulso, sem permanencia' },
      { modality: 'PILATES', name: 'SMART', frequency: '3x/semana', priceInCents: 28900, active: true, description: 'Mensal avulso, sem permanencia' },
      { modality: 'PILATES', name: 'ELITE', frequency: '2x/semana', priceInCents: 19900, active: true, description: 'Recorrencia 12 meses' },
      { modality: 'PILATES', name: 'ELITE', frequency: '3x/semana', priceInCents: 25900, active: true, description: 'Recorrencia 12 meses' },
      { modality: 'PILATES', name: 'FLEX', frequency: '2x/semana', priceInCents: 21900, active: true, description: 'Recorrencia mensal sem fidelidade' },
      { modality: 'PILATES', name: 'FLEX', frequency: '3x/semana', priceInCents: 26900, active: true, description: 'Recorrencia mensal sem fidelidade' },
      { modality: 'MUSCULACAO', name: 'SMART', frequency: '2x/semana', priceInCents: 44900, active: true, description: 'Mensal avulso, sem permanencia' },
      { modality: 'MUSCULACAO', name: 'SMART', frequency: '3x/semana', priceInCents: 54900, active: true, description: 'Mensal avulso, sem permanencia' },
      { modality: 'MUSCULACAO', name: 'SMART', frequency: '5x/semana', priceInCents: 69900, active: true, description: 'Mensal avulso, sem permanencia' },
      { modality: 'MUSCULACAO', name: 'ELITE', frequency: '2x/semana', priceInCents: 34900, active: true, description: 'Recorrencia 12 meses' },
      { modality: 'MUSCULACAO', name: 'ELITE', frequency: '3x/semana', priceInCents: 44900, active: true, description: 'Recorrencia 12 meses' },
      { modality: 'MUSCULACAO', name: 'ELITE', frequency: '5x/semana', priceInCents: 59900, active: true, description: 'Recorrencia 12 meses' },
      { modality: 'MUSCULACAO', name: 'FLEX', frequency: '2x/semana', priceInCents: 39900, active: true, description: 'Recorrencia mensal sem fidelidade' },
      { modality: 'MUSCULACAO', name: 'FLEX', frequency: '3x/semana', priceInCents: 49900, active: true, description: 'Recorrencia mensal sem fidelidade' },
      { modality: 'MUSCULACAO', name: 'FLEX', frequency: '5x/semana', priceInCents: 64900, active: true, description: 'Recorrencia mensal sem fidelidade' },
      { modality: 'CROSSTRAINING', name: 'SMART', frequency: 'ilimitado', priceInCents: 26900, active: true, description: 'Mensal avulso, treine todos os dias' },
      { modality: 'CROSSTRAINING', name: 'ELITE', frequency: 'ilimitado', priceInCents: 20900, active: true, description: 'Recorrencia 12 meses, treine todos os dias' },
      { modality: 'CROSSTRAINING', name: 'FLEX', frequency: 'ilimitado', priceInCents: 23900, active: true, description: 'Recorrencia mensal sem fidelidade, treine todos os dias' },
        ];
    for (const p of plans) {
          await prisma.plan.create({ data: p as any });
          console.log('   OK ' + p.modality + ' ' + p.name + ' ' + p.frequency + ' R$ ' + (p.priceInCents/100).toFixed(2));
    }

  console.log('\nSeed concluido!');
    const total = await Promise.all([prisma.settings.count(), prisma.plan.count()]);
    console.log('   ' + total[0] + ' settings, ' + total[1] + ' planos');
}

main().catch(e => { console.error('ERRO no seed:', e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const emails = ['pedrowicloud@gmail.com', 'coliseutx@gmail.com'];
  
  for (const email of emails) {
    const user = await prisma.user.upsert({
      where: { email },
      update: { role: 'ADMIN' },
      create: {
        email,
        name: email === 'pedrowicloud@gmail.com' ? 'Pedro Admin' : 'Coliseu Admin',
        role: 'ADMIN',
      },
    });
    console.log('✅ Usuário configurado como ADMIN:', user.email);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rezan = await prisma.user.findUnique({ where: { email: 'rezan.selva@gmail.com' } });
  console.log('Rezan:', rezan?.roles, rezan?.isRegulateur);
  const hamid = await prisma.user.findUnique({ where: { email: 'hamid@vdf-ambulance.com' } });
  console.log('Hamid:', hamid?.roles, hamid?.isRegulateur);
}

main().catch(console.error).finally(() => prisma.$disconnect());

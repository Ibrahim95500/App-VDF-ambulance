import { prisma } from './src/lib/prisma';

async function main() {
  const user = await prisma.user.findFirst({
    where: { telegramChatId: '8457900796' }
  });
  console.log('Result:', user);
}

main().finally(() => prisma.$disconnect());

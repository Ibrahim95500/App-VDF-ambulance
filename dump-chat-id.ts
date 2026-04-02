import { prisma } from './src/lib/prisma';

async function main() {
  try {
    const users = await prisma.user.findMany({
      where: { telegramChatId: { not: null } },
      select: { name: true, email: true, telegramChatId: true }
    });
    console.log("===============================");
    console.log(JSON.stringify(users, null, 2));
    console.log("===============================");
  } catch (error) {
    console.error("Erreur :", error);
  } finally {
    process.exit(0);
  }
}

main();

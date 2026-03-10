const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- DÉMARRAGE FIX URGENCE PRÉSENTATION ---');
  try {
    // 1. Force l'ajout du rôle s'il manque via une requête brute
    await prisma.$executeRawUnsafe(`ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'ADMIN';`);
    console.log('✅ Type ADMIN assuré dans la BDD.');
  } catch(e) {
    console.log('Info: Le type ADMIN existe déjà ou erreur bénigne.', e.message);
  }

  try {
    // 2. Assigne le rôle aux admins
    await prisma.$executeRawUnsafe(`UPDATE "User" SET roles = ARRAY['ADMIN']::"Role"[] WHERE email IN ('hamid.vdf@gmail.com', 'rezan.selva@gmail.com');`);
    console.log('✅ Rôles admin attribués à Hamid et Rezan.');
  } catch (e) {
    console.error('❌ Erreur lors de l attribution des rôles :', e);
  }

  console.log('--- OPÉRATION TERMINÉE AVEC SUCCÈS ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

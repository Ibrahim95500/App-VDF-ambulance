const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('--- Démarrage de la Graine de Production (VDF Ambulance) NATIVE ---');

    const rhEmail = process.env.RH_ADMIN_EMAIL || 'admin@ambulance.com';
    const rhPassword = process.env.RH_ADMIN_PASSWORD || 'VDF_Ambu_2026_Secure_Db';
    const hashedPassword = await bcrypt.hash(rhPassword, 10);

    const rhFirstName = process.env.RH_ADMIN_FIRST_NAME || 'Hamid';
    const rhLastName = process.env.RH_ADMIN_LAST_NAME || 'CHEIKH';

    const testUsers = [
        { email: rhEmail, password: rhPassword, role: 'RH', firstName: rhFirstName, lastName: rhLastName },
        { email: 'salarie@vdf.fr', password: 'password123', role: 'USER', firstName: 'Utilisateur', lastName: 'Test' },
        { email: 'hamid@vdf.fr', password: 'password123', role: 'USER', firstName: 'Hamid', lastName: 'Ambulancier' },
    ];

    for (const userData of testUsers) {
        const existingUser = await prisma.user.findUnique({
            where: { email: userData.email }
        });

        if (!existingUser) {
            const userHashedPassword = userData.email === rhEmail ? hashedPassword : await bcrypt.hash(userData.password, 10);
            await prisma.user.create({
                data: {
                    email: userData.email,
                    name: `${userData.firstName} ${userData.lastName} `,
                    role: userData.role,
                    password: userHashedPassword,
                    firstName: userData.firstName,
                    lastName: userData.lastName
                }
            });
            console.log(`✅ Succès: Création de ${userData.firstName} ${userData.lastName} (${userData.email} | ${userData.role})`);
        } else {
            console.log(`ℹ️ Info: L'utilisateur ${userData.email} existe déjà.`);
        }
    }

    console.log('--- Terminé ! ---');
}

main()
    .catch((e) => {
        console.error('❌ FATAL ERROR:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

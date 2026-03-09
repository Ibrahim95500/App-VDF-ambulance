import { PrismaClient, Role } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

async function main() {
    console.log("--- DIAGNOSTIC AGENT BD ---");
    console.log("DATABASE_URL present:", !!process.env.DATABASE_URL);

    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
        throw new Error("DATABASE_URL is missing from environment variables!");
    }

    const pool = new Pool({ connectionString })
    const adapter = new PrismaPg(pool)
    const prisma = new PrismaClient({ adapter })

    console.log("Démarrage du script de seed...");
    const rhEmail = process.env.RH_ADMIN_EMAIL || 'admin@ambulance.com'
    const rhPassword = process.env.RH_ADMIN_PASSWORD || 'VDF_Ambu_2026_Secure_Db'
    const hashedPassword = await bcrypt.hash(rhPassword, 10)

    const rhFirstName = process.env.RH_ADMIN_FIRST_NAME || 'Hamid';
    const rhLastName = process.env.RH_ADMIN_LAST_NAME || 'CHEIKH';

    // Mise à jour de Rezan en rôle RH (Accès complet)
    await prisma.user.upsert({
        where: { email: 'rezan.selva@gmail.com' },
        update: { role: 'RH', isTeamLeader: true },
        create: {
            email: 'rezan.selva@gmail.com',
            name: 'Rezan SELVA',
            role: 'RH',
            firstName: 'Rezan',
            lastName: 'SELVA',
            isTeamLeader: true
        }
    });

    // Seed des Véhicules
    const vehicles = [
        { plateNumber: 'EP-268-EJ', category: 'MARK' as const },
        { plateNumber: 'FB-913-YS', category: 'MARK' as const },
        { plateNumber: 'FH-181-FX', category: 'MARK' as const },
        { plateNumber: 'FK-433-KS', category: 'VDF' as const },
        { plateNumber: 'FK-477-KR', category: 'VDF' as const },
        { plateNumber: 'FK-840-CN', category: 'VDF' as const },
    ];

    for (const v of vehicles) {
        await prisma.vehicle.upsert({
            where: { plateNumber: v.plateNumber },
            update: {},
            create: v
        });
    }

    // Seed des 6 salariés de test réalistes
    const testUsers = [
        { email: 'resp.mark@vdf.fr', firstName: 'Responsable', lastName: 'MARK', structure: 'MARK' as const, diploma: 'DEA' as const, shift: 'JOUR' as const, isTeamLeader: true },
        { email: 'coeq.mark@vdf.fr', firstName: 'Coéquipier', lastName: 'MARK', structure: 'MARK' as const, diploma: 'AUXILIAIRE' as const, shift: 'JOUR' as const, isTeamLeader: false },
        { email: 'resp.vdf@vdf.fr', firstName: 'Responsable', lastName: 'VDF', structure: 'VDF' as const, diploma: 'DEA' as const, shift: 'NUIT' as const, isTeamLeader: true },
        { email: 'coeq.vdf@vdf.fr', firstName: 'Coéquipier', lastName: 'VDF', structure: 'VDF' as const, diploma: 'AUXILIAIRE' as const, shift: 'NUIT' as const, isTeamLeader: false },
        { email: 'resp.les2@vdf.fr', firstName: 'Responsable', lastName: 'LES2', structure: 'LES_2' as const, diploma: 'DEA' as const, shift: 'JOUR_NUIT' as const, isTeamLeader: true },
        { email: 'coeq.les2@vdf.fr', firstName: 'Coéquipier', lastName: 'LES2', structure: 'LES_2' as const, diploma: 'AUXILIAIRE' as const, shift: 'JOUR_NUIT' as const, isTeamLeader: false },
    ];

    for (const userData of testUsers) {
        const password = await bcrypt.hash('password123', 10);
        await prisma.user.upsert({
            where: { email: userData.email },
            update: { ...userData },
            create: {
                ...userData,
                name: `${userData.firstName} ${userData.lastName}`,
                password: password,
                role: 'SALARIE'
            }
        });
    }

    console.log('Seed de régulation terminé avec succès.');
    await prisma.$disconnect()
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })

import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const rhEmail = process.env.RH_ADMIN_EMAIL || 'admin@ambulance.com'
    const rhPassword = process.env.RH_ADMIN_PASSWORD || 'VDF_Ambu_2026_Secure_Db'
    const hashedPassword = await bcrypt.hash(rhPassword, 10)

    const rhFirstName = process.env.RH_ADMIN_FIRST_NAME || 'Hamid';
    const rhLastName = process.env.RH_ADMIN_LAST_NAME || 'CHEIKH';

    // Define the list of users to be seeded
    const testUsers = [
        { email: rhEmail, password: rhPassword, role: 'RH' as Role, firstName: rhFirstName, lastName: rhLastName }, // Use environment variables for RH admin
        { email: 'salarie@vdf.fr', password: 'password123', role: 'USER' as Role, firstName: 'Utilisateur', lastName: 'Test' },
        { email: 'hamid@vdf.fr', password: 'password123', role: 'USER' as Role, firstName: 'Hamid', lastName: 'Ambulancier' },
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
            console.log(`Created user: ${userData.email} with role ${userData.role}.`);
        } else {
            console.log(`User ${userData.email} already exists.`);
        }
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

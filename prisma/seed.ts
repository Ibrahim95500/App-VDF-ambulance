import { prisma } from '../src/lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
    const rhEmail = process.env.RH_ADMIN_EMAIL || 'admin@ambulance.com'
    const rhPassword = process.env.RH_ADMIN_PASSWORD || 'VDF_Ambu_2026_Secure_Db'
    const hashedPassword = await bcrypt.hash(rhPassword, 10)

    const existingRH = await prisma.user.findUnique({
        where: { email: rhEmail }
    })

    if (!existingRH) {
        await prisma.user.create({
            data: {
                email: rhEmail,
                name: 'Admin RH',
                role: 'RH',
                password: hashedPassword,
                firstName: 'Admin',
                lastName: 'VDF'
            }
        })
        console.log(`Created RH user: ${rhEmail} with default password.`)
    } else {
        console.log(`RH user ${rhEmail} already exists.`)
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

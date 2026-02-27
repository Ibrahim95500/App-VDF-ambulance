import { prisma } from '../src/lib/prisma'

async function main() {
    const rhEmail = process.env.RH_ADMIN_EMAIL || 'admin@ambulance.com'

    const existingRH = await prisma.user.findUnique({
        where: { email: rhEmail }
    })

    if (!existingRH) {
        await prisma.user.create({
            data: {
                email: rhEmail,
                name: 'Admin RH',
                role: 'RH'
            }
        })
        console.log(`Created RH user: ${rhEmail}`)
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

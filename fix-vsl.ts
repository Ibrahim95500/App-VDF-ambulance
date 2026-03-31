import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const vehicles = await prisma.vehicle.updateMany({
        where: { plateNumber: 'VSL-GENERIC' },
        data: { plateNumber: 'VSL' }
    })
    console.log(`Corrigé ${vehicles.count} véhicules.`)
}

main().catch(console.error).finally(() => prisma.$disconnect())

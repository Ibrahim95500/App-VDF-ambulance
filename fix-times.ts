import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const assignments = await prisma.planningAssignment.updateMany({
        where: { startTime: null },
        data: { startTime: "07:00" } // Valeur par défaut pour les affichages
    })
    console.log(`Corrigé ${assignments.count} assignations sans heure de début.`)
}

main().catch(console.error).finally(() => prisma.$disconnect())

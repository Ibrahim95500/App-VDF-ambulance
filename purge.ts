import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log("Recherche de l'utilisateur ibrahim.nifa01@gmail.com...")
    const user = await prisma.user.findUnique({ where: { email: "ibrahim.nifa01@gmail.com" } })
    if (!user) return console.error("Introuvable !");

    const delPlanning = await prisma.planningAssignment.deleteMany({
        where: { OR: [{ leaderId: user.id }, { teammateId: user.id }] }
    })
    console.log(`- ${delPlanning.count} assignations Planning effacées.`)

    const delRegul = await prisma.regulationAssignment.deleteMany({ where: { userId: user.id } })
    console.log(`- ${delRegul.count} Régulation effacées.`)

    const delDispo = await prisma.disponibility.deleteMany({ where: { userId: user.id } })
    console.log(`- ${delDispo.count} Disponibilité effacées.`)

    const updated = await prisma.user.update({
        where: { id: user.id },
        data: { oubliCount: 0 }
    })
    console.log(`- Oubli remis à 0.`)
    console.log("✅ Fini !")
}

main().catch(console.error).finally(() => prisma.$disconnect())

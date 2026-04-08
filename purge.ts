import { prisma } from './src/lib/prisma'

async function main() {
    console.log("Recherche de l'utilisateur ibrahim.nifa01@gmail.com...")
    const user = await prisma.user.findUnique({ where: { email: "ibrahim.nifa01@gmail.com" } })
    if (!user) return console.error("Introuvable !");

    // Limite avant 24h (la veille à minuit)
    const thresholdDate = new Date()
    thresholdDate.setDate(thresholdDate.getDate() - 1)
    thresholdDate.setHours(0, 0, 0, 0)
    console.log(`Suppression de tout l'historique avant le : ${thresholdDate.toLocaleDateString('fr-FR')}`)

    const delPlanning = await prisma.planningAssignment.deleteMany({
        where: { 
            OR: [{ leaderId: user.id }, { teammateId: user.id }],
            date: { lt: thresholdDate }
        }
    })
    console.log(`- ${delPlanning.count} assignations Planning effacées.`)

    const delRegul = await prisma.regulationAssignment.deleteMany({ 
        where: { userId: user.id, date: { lt: thresholdDate } }
    })
    console.log(`- ${delRegul.count} Régulation effacées.`)

    const delDispo = await prisma.disponibility.deleteMany({ 
        where: { userId: user.id, date: { lt: thresholdDate } }
    })
    console.log(`- ${delDispo.count} Disponibilité effacées.`)

    const updated = await prisma.user.update({
        where: { id: user.id },
        data: { oubliCount: 0 }
    })
    console.log(`- Oubli remis à 0.`)
    console.log("✅ Fini !")
}

main().catch(console.error).finally(() => prisma.$disconnect())

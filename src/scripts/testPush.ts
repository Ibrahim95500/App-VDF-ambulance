import { PrismaClient } from '@prisma/client'
import webpush from 'web-push'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })
dotenv.config({ path: path.join(process.cwd(), '.env') })

const prisma = new PrismaClient()

async function main() {
    console.log("Recherche des Régulateurs et Admins...")
    const users = await prisma.user.findMany({
        where: {
            role: { in: ['ADMIN', 'SUPER_ADMIN', 'REGULATEUR'] }
        },
        include: { pushSubscriptions: true }
    })

    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
        throw new Error("Clés VAPID manquantes dans .env")
    }

    webpush.setVapidDetails(
        'mailto:contact@vdf-ambulance.fr',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    )

    let sent = 0
    for (const user of users) {
        if (user.pushSubscriptions.length > 0) {
            console.log(`Envoi à ${user.firstName} ${user.lastName} (${user.role})...`)
            for (const sub of user.pushSubscriptions) {
                try {
                    await webpush.sendNotification({
                        endpoint: sub.endpoint,
                        keys: { p256dh: sub.p256dh, auth: sub.auth }
                    }, JSON.stringify({
                        title: "🤖 Test du Robot Sniper",
                        message: "Ceci est un test PUSH officiel du système VDF Ambulance. Tout est opérationnel !",
                        url: "/dashboard"
                    }))
                    sent++
                } catch (e) {
                    console.error("Erreur push pour un sub:", e.message)
                }
            }
        }
    }
    
    console.log(`Terminé ! ${sent} notifications envoyées.`)
}

main().catch(console.error).finally(() => prisma.$disconnect())

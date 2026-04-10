import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import webpush from 'web-push'
import { sendPushNotification } from "@/actions/web-push.actions"

export async function POST(req: Request) {
    try {
        // Optionnel : sécuriser la route avec un token CRON
        const today = new Date()
        // Création forcée en UTC pour correspondre exactement aux entrées Prisma qui stockent '2026-04-10T00:00:00.000Z'
        const startOfDay = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()))
        const tomorrow = new Date(startOfDay)
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)

        // On cherche toutes les assignations non validées de ce soir ou demain
        const assignments = await prisma.planningAssignment.findMany({
            where: {
                AND: [
                    {
                        OR: [
                            { date: startOfDay, startTime: { gte: "18:00" } }, // Les équipes de nuit ce soir
                            { date: tomorrow } // Les équipes de demain
                        ]
                    },
                    {
                        OR: [
                            { leaderValidated: false },
                            { teammateValidated: false }
                        ]
                    }
                ]
            },
            include: {
                leader: { select: { id: true, pushSubscriptions: true, fcmTokens: true } },
                teammate: { select: { id: true, pushSubscriptions: true, fcmTokens: true } }
            }
        })

        if (assignments.length === 0) {
            return NextResponse.json({ message: "Personne à relancer." })
        }

        const usersToAlert = new Set<string>()

        for (const a of assignments) {
            if (!a.leaderValidated && a.leaderId) usersToAlert.add(a.leaderId)
            if (!a.teammateValidated && a.teammateId) usersToAlert.add(a.teammateId)
        }

        console.log(`[CRON 20h00] Relance de validation : ${usersToAlert.size} agents identifiés.`)

        const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!vapidPublicKey || !process.env.VAPID_PRIVATE_KEY) {
            console.error("VAPID keys missing env config")
            return NextResponse.json({ error: "Missing VAPID" }, { status: 500 })
        }

        webpush.setVapidDetails(
            'mailto:contact@vdf-ambulance.fr',
            vapidPublicKey,
            process.env.VAPID_PRIVATE_KEY
        )

        for (const userId of Array.from(usersToAlert)) {
            // Créer une notification interne
            await prisma.notification.create({
                data: {
                    userId,
                    title: "Action Requise !",
                    message: "⏰ Veuillez valider votre heure de prise de service dans le planning pour votre prochaine garde.",
                    type: "REMINDER_VALIDATION",
                    link: "/dashboard/salarie"
                }
            })

            // Appel de la méthode unifiée (PWA Web Push + Native FCM iOS/Android)
            await sendPushNotification(
                userId,
                "Action Requise !",
                "⏰ Veuillez valider votre heure de prise de service.",
                "/dashboard/salarie"
            )
        }

        return NextResponse.json({ success: true, alerted: usersToAlert.size })

    } catch (error) {
        console.error("Erreur Cron Alert", error)
        return NextResponse.json({ error: "Interne" }, { status: 500 })
    }
}

import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import webpush from 'web-push'

export async function POST(req: Request) {
    try {
        // Optionnel : sécuriser la route avec un token CRON
        const today = new Date()
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        const tomorrow = new Date(startOfDay)
        tomorrow.setDate(tomorrow.getDate() + 1)

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

        if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
            console.error("VAPID keys missing env config")
            return NextResponse.json({ error: "Missing VAPID" }, { status: 500 })
        }

        webpush.setVapidDetails(
            'mailto:contact@vdf-ambulance.fr',
            process.env.VAPID_PUBLIC_KEY,
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

            // Firebase: Notif PWA...
            const userSub = await prisma.pushSubscription.findMany({ where: { userId } })
            for (const sub of userSub) {
                try {
                    await webpush.sendNotification({
                        endpoint: sub.endpoint,
                        keys: { p256dh: sub.p256dh, auth: sub.auth }
                    }, JSON.stringify({
                        title: "Action Requise !",
                        message: "⏰ Veuillez valider votre heure de prise de service.",
                        url: "/dashboard/salarie"
                    }))
                } catch (e) { }
            }
        }

        return NextResponse.json({ success: true, alerted: usersToAlert.size })

    } catch (error) {
        console.error("Erreur Cron Alert", error)
        return NextResponse.json({ error: "Interne" }, { status: 500 })
    }
}

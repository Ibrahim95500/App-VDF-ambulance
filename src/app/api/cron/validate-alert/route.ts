import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import webpush from 'web-push'
import { sendPushNotification } from "@/actions/web-push.actions"
import { sendTelegramMessage } from "@/lib/telegram/telegram-api"

export async function GET(req: Request) {
    return handleCron(req);
}

export async function POST(req: Request) {
    return handleCron(req);
}

async function handleCron(req: Request) {
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
                leader: { select: { id: true, telegramChatId: true, pushSubscriptions: true, fcmTokens: true } },
                teammate: { select: { id: true, telegramChatId: true, pushSubscriptions: true, fcmTokens: true } }
            }
        })

        if (assignments.length === 0) {
            return NextResponse.json({ message: "Personne à relancer." })
        }

        const usersToAlert = new Map<string, string | null>()

        for (const a of assignments) {
            if (!a.leaderValidated && a.leader?.id) usersToAlert.set(a.leader.id, a.leader.telegramChatId)
            if (!a.teammateValidated && a.teammate?.id) usersToAlert.set(a.teammate.id, a.teammate.telegramChatId)
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

        const tgKeyboard = {
            inline_keyboard: [
                [{ text: "✅ Valider ma mission", url: `${process.env.NEXTAUTH_URL}/dashboard/salarie/regulation` }]
            ]
        };

        for (const [userId, tgChatId] of Array.from(usersToAlert.entries())) {
            // Créer une notification interne
            await prisma.notification.create({
                data: {
                    userId,
                    title: "Action Requise !",
                    message: "⏰ Veuillez valider votre heure de prise de service dans le planning pour votre prochaine garde.",
                    type: "REMINDER_VALIDATION",
                    link: "/dashboard/salarie/regulation"
                }
            })

            // Appel de la méthode unifiée (PWA Web Push + Native FCM iOS/Android)
            await sendPushNotification(
                userId,
                "Action Requise !",
                "⏰ Veuillez valider votre heure de prise de service.",
                "/dashboard/salarie/regulation"
            )

            if (tgChatId) {
                const msg = `🚨 <b>ACTION REQUISE</b>\n\n⏰ Vous n'avez pas encore validé votre prise de poste pour votre prochaine garde.\n👉 Merci de le faire immédiatement via l'App !`;
                await sendTelegramMessage(tgChatId, msg, tgKeyboard).catch(console.error);
            }
        }

        return NextResponse.json({ success: true, alerted: usersToAlert.size })

    } catch (error) {
        console.error("Erreur Cron Alert", error)
        return NextResponse.json({ error: "Interne" }, { status: 500 })
    }
}

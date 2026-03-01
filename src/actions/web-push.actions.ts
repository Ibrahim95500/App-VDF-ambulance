"use server"

import { prisma as db } from "@/lib/prisma"
import { auth } from "@/auth"
import webpush from "web-push"

const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BAI_PkE59fsaJPoOTDp1ueGcfAJ2LM_11e9R6egnWeCfXlgy187bohGv2yRK96LPyTSAOWfsJfRSCYcWCUsJVgc"
const vapidPrivate = process.env.VAPID_PRIVATE_KEY || "f236x3mFmH2u0sC59U-yIfdEaYfO2zHq8S7Z_K8gP-c"
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:ibrahim.nifa01@gmail.com"

webpush.setVapidDetails(
    vapidSubject,
    vapidPublic,
    vapidPrivate
)

export async function savePushSubscription(subscription: any) {
    try {
        const session = await auth()
        if (!session?.user?.id) return { error: "Non autorisé" }

        // Make sure we don't have this exact endpoint already
        const existing = await db.pushSubscription.findUnique({
            where: { endpoint: subscription.endpoint }
        })

        if (!existing) {
            await db.pushSubscription.create({
                data: {
                    userId: session.user.id,
                    endpoint: subscription.endpoint,
                    p256dh: subscription.keys.p256dh,
                    auth: subscription.keys.auth
                }
            })
        }

        return { success: true }
    } catch (error) {
        console.error("Error saving push subscription:", error)
        return { error: "Erreur lors de l'enregistrement de l'abonnement" }
    }
}

export async function getVapidPublicKey() {
    return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BAI_PkE59fsaJPoOTDp1ueGcfAJ2LM_11e9R6egnWeCfXlgy187bohGv2yRK96LPyTSAOWfsJfRSCYcWCUsJVgc"
}

export async function sendPushNotification(userId: string, title: string, message: string, url: string = "/") {
    try {
        const subscriptions = await db.pushSubscription.findMany({
            where: { userId }
        })

        if (subscriptions.length === 0) return { success: false, message: "No subscriptions found" }

        const payload = JSON.stringify({
            title,
            body: message,
            url,
            icon: "/media/app/logo.png"
        })

        const removePromises: Promise<any>[] = []

        const notifications = subscriptions.map(sub => {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            };
            const options = {
                TTL: 24 * 60 * 60, // 24 hours
                urgency: 'high' as const
            };

            return webpush.sendNotification(pushSubscription, payload, options).catch((error) => {
                if (error.statusCode === 404 || error.statusCode === 410) {
                    // Subscription has expired or is no longer valid
                    removePromises.push(
                        db.pushSubscription.delete({ where: { id: sub.id } })
                    )
                } else {
                    console.error("Error sending push to subscription:", error)
                }
            })
        })

        await Promise.allSettled(notifications)
        if (removePromises.length > 0) {
            await Promise.allSettled(removePromises)
        }

        return { success: true }
    } catch (error) {
        console.error("Failed to send push notification:", error)
        return { error: "Erreur d'envoi de notification push" }
    }
}

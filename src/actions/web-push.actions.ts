"use server"

import { prisma as db } from "@/lib/prisma"
import { auth } from "@/auth"
import * as webpush from 'web-push';
import { getFcm } from "@/lib/firebase-admin";

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

export async function saveFcmToken(token: string) {
    try {
        const session = await auth()
        if (!session?.user?.id) return { error: "Non autorisé" }

        await db.fcmToken.upsert({
            where: { token },
            update: { userId: session.user.id },
            create: {
                userId: session.user.id,
                token
            }
        })

        return { success: true }
    } catch (error) {
        console.error("Error saving FCM token:", error)
        return { error: "Erreur lors de l'enregistrement du token push" }
    }
}

export async function getVapidPublicKey() {
    return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BAI_PkE59fsaJPoOTDp1ueGcfAJ2LM_11e9R6egnWeCfXlgy187bohGv2yRK96LPyTSAOWfsJfRSCYcWCUsJVgc"
}

export async function sendPushNotification(userId: string, title: string, message: string, url: string = "/") {
    try {
        // 1. Web Push (PWA)
        const webSubscriptions = await db.pushSubscription.findMany({
            where: { userId }
        })

        // 2. Native Push (Capacitor/FCM)
        const fcmTokens = await db.fcmToken.findMany({
            where: { userId }
        })

        if (webSubscriptions.length === 0 && fcmTokens.length === 0) {
            return { success: false, message: "No subscriptions found" }
        }

        const payload = JSON.stringify({
            title,
            body: message,
            url,
            icon: "/media/app/logo.png"
        })

        const removePromises: Promise<any>[] = []

        // Send Web Push
        const webNotifications = webSubscriptions.map(sub => {
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
                    removePromises.push(
                        db.pushSubscription.delete({ where: { id: sub.id } })
                    )
                } else {
                    console.error("Error sending web push:", error)
                }
            })
        })

        // Send FCM (Native)
        let fcmNotification = Promise.resolve();
        const fcm = getFcm();
        if (fcm && fcmTokens.length > 0) {
            const tokens = fcmTokens.map((t: any) => t.token);
            fcmNotification = fcm.sendEachForMulticast({
                tokens,
                notification: {
                    title,
                    body: message,
                },
                data: {
                    url,
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                            badge: 1,
                        },
                    },
                },
            }).then((response) => {
                if (response.failureCount > 0) {
                    response.responses.forEach((resp, idx) => {
                        if (!resp.success) {
                            const error = resp.error;
                            if (error?.code === 'messaging/invalid-registration-token' ||
                                error?.code === 'messaging/registration-token-not-registered') {
                                removePromises.push(
                                    db.fcmToken.delete({ where: { token: tokens[idx] } })
                                )
                            }
                        }
                    });
                }
            }).catch(error => {
                console.error("Error sending FCM notification:", error);
            });
        }

        await Promise.allSettled([...webNotifications, fcmNotification])
        if (removePromises.length > 0) {
            await Promise.allSettled(removePromises)
        }

        return { success: true }
    } catch (error) {
        console.error("Failed to send push notification:", error)
        return { error: "Erreur d'envoi de notification push" }
    }
}

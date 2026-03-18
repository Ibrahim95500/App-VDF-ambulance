"use server"

import { prisma as db } from "@/lib/prisma"
import { auth } from "@/auth"
import * as webpush from 'web-push';
import { getFcm } from "@/lib/firebase-admin";

const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BAI_PkE59fsaJPoOTDp1ueGcfAJ2LM_11e9R6egnWeCfXlgy187bohGv2yRK96LPyTSAOWfsJfRSCYcWCUsJVgc"
const vapidPrivate = process.env.VAPID_PRIVATE_KEY || "UC6DQpZZPEpYWNoYVS89uhDOR2eoK8HS9Cn93STUrUM"
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
    console.log(`[PUSH_DEBUG] Start: userId=${userId}, title=${title}`);
    try {
        // 1. Web Push (PWA)
        const webSubscriptions = await db.pushSubscription.findMany({
            where: { userId }
        });

        // 2. Native Push (Capacitor/FCM)
        const fcmTokens = await db.fcmToken.findMany({
            where: { userId }
        });

        console.log(`[PUSH_DEBUG] Target User ${userId}: Found ${webSubscriptions.length} Web subs and ${fcmTokens.length} FCM tokens`);

        if (webSubscriptions.length === 0 && fcmTokens.length === 0) {
            console.log(`[PUSH_DEBUG] No subscriptions for user ${userId}, aborting.`);
            return { success: false, message: "No subscriptions found" };
        }

        const payload = JSON.stringify({
            title,
            body: message,
            url,
            icon: "/media/app/logo.png"
        });

        const removePromises: Promise<any>[] = [];

        // Send Web Push
        const webNotifications = webSubscriptions.map((sub: any) => {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            };
            const options = {
                TTL: 24 * 60 * 60,
                urgency: 'high' as const
            };

            return webpush.sendNotification(pushSubscription, payload, options).catch((error) => {
                if (error.statusCode === 404 || error.statusCode === 410) {
                    removePromises.push(
                        db.pushSubscription.delete({ where: { id: sub.id } })
                    );
                } else {
                    console.error("[PUSH_DEBUG] Web Push Error:", error);
                }
            });
        });

        // Send FCM (Native)
        let fcmNotification = Promise.resolve();
        const fcm = getFcm();
        
        if (fcm && fcmTokens.length > 0) {
            const tokens = fcmTokens.map((t: any) => t.token);
            console.log(`[PUSH_DEBUG] Sending FCM to ${tokens.length} tokens...`);
            
            fcmNotification = fcm.sendEachForMulticast({
                tokens,
                notification: {
                    title,
                    body: message,
                },
                data: {
                    url,
                },
                android: {
                    priority: 'high',
                    notification: {
                        sound: 'default',
                        clickAction: 'FCM_PLUGIN_ACTIVITY',
                        icon: 'stock_ticker_update',
                        color: '#f97316',
                        channelId: 'vdf-notifications',
                        visibility: 'public'
                    }
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                            badge: 1,
                            alert: {
                                title: title,
                                body: message,
                            },
                            contentAvailable: true,
                        },
                    },
                },
            }).then((response) => {
                console.log(`[PUSH_DEBUG] FCM Multicast Result: success=${response.successCount}, failure=${response.failureCount}`);
                if (response.failureCount > 0) {
                    response.responses.forEach((resp, idx) => {
                        if (!resp.success) {
                            const error = resp.error;
                            console.error(`[PUSH_DEBUG] FCM Token Error [${idx}]:`, error);
                            if (error?.code === 'messaging/invalid-registration-token' ||
                                error?.code === 'messaging/registration-token-not-registered') {
                                removePromises.push(
                                    db.fcmToken.delete({ where: { token: tokens[idx] } })
                                );
                            }
                        }
                    });
                }
            }).catch(error => {
                console.error("[PUSH_DEBUG] Critical FCM Error:", error);
            });
        } else {
            console.log(`[PUSH_DEBUG] FCM skipped: fcmExists=${!!fcm}, tokenCount=${fcmTokens.length}`);
        }

        await Promise.allSettled([...webNotifications, fcmNotification]);
        if (removePromises.length > 0) {
            await Promise.allSettled(removePromises);
        }

        return { success: true };
    } catch (error) {
        console.error("[PUSH_DEBUG] Global Error:", error);
        return { error: "Erreur d'envoi de notification push" };
    }
}

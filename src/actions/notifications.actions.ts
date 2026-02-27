"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getNotifications() {
    const session = await auth()
    if (!session?.user?.id) return []

    console.log("Fetching notifications for user:", session.user.id);
    const notifications = await prisma.notification.findMany({
        where: {
            userId: session.user.id,
            dismissed: false
        },
        orderBy: { createdAt: 'desc' },
        take: 20
    })
    console.log(`Found ${notifications.length} notifications`);
    return notifications;
}

export async function getUnreadNotificationsCount() {
    const session = await auth()
    if (!session?.user?.id) return 0

    return await prisma.notification.count({
        where: {
            userId: session.user.id,
            read: false,
            dismissed: false
        }
    })
}

export async function markAsRead(notificationId: string) {
    await prisma.notification.update({
        where: { id: notificationId },
        data: { read: true }
    })
    revalidatePath('/')
}

export async function dismissNotification(notificationId: string) {
    console.log("Dismissing notification:", notificationId);
    try {
        const result = await prisma.notification.update({
            where: { id: notificationId },
            data: { dismissed: true }
        })
        console.log("Notification dismissed in DB:", result.id);
        revalidatePath('/')
        return { success: true };
    } catch (err) {
        console.error("Failed to dismiss notification:", err);
        throw err;
    }
}

export async function markAllAsRead() {
    const session = await auth()
    if (!session?.user?.id) return

    await prisma.notification.updateMany({
        where: { userId: session.user.id, dismissed: false },
        data: { read: true }
    })
    revalidatePath('/')
}

export async function createNotification({
    userId,
    title,
    message,
    type,
    status,
    link
}: {
    userId: string,
    title: string,
    message: string,
    type: "ADVANCE" | "LEAVE" | "SERVICE",
    status?: string,
    link?: string
}) {
    await prisma.notification.create({
        data: {
            userId,
            title,
            message,
            type,
            status,
            link
        }
    })
    revalidatePath('/')
}

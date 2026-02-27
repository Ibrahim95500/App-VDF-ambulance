"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getNotifications() {
    const session = await auth()
    if (!session?.user?.id) return []

    return await prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: 20
    })
}

export async function getUnreadNotificationsCount() {
    const session = await auth()
    if (!session?.user?.id) return 0

    return await prisma.notification.count({
        where: {
            userId: session.user.id,
            read: false
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

export async function markAllAsRead() {
    const session = await auth()
    if (!session?.user?.id) return

    await prisma.notification.updateMany({
        where: { userId: session.user.id },
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
    type: "ADVANCE" | "LEAVE",
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

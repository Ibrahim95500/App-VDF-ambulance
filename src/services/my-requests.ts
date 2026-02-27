import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function getMyAdvanceRequests() {
    const session = await auth()

    if (!session?.user?.id) {
        return []
    }

    return await prisma.advanceRequest.findMany({
        where: {
            userId: session.user.id
        },
        orderBy: {
            createdAt: 'desc'
        }
    })
}

export type MyAdvanceRequest = Awaited<ReturnType<typeof getMyAdvanceRequests>>[number]

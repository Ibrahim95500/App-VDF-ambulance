import { prisma } from "@/lib/prisma"

export async function getAdvanceRequests() {
    return await prisma.advanceRequest.findMany({
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                    image: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    })
}

export type AdvanceRequestWithUser = Awaited<ReturnType<typeof getAdvanceRequests>>[number]

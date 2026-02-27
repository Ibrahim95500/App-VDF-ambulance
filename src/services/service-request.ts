import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function getAllServiceRequests() {
    const session = await auth()
    if ((session?.user as any)?.role !== "RH") return []

    return await prisma.serviceRequest.findMany({
        include: {
            user: {
                select: {
                    name: true,
                    firstName: true,
                    lastName: true,
                    email: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    })
}

export type GlobalServiceRequest = Awaited<ReturnType<typeof getAllServiceRequests>>[number]

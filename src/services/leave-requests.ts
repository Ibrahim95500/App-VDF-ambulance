import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export async function getMyLeaveRequests() {
    const session = await auth()

    if (!session?.user?.email) {
        return []
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    })

    if (!user) {
        return []
    }

    const requests = await prisma.leaveRequest.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
    })

    return requests
}

export async function getAllLeaveRequests() {
    const session = await auth()

    if (!session?.user || (session.user as any).role !== "RH") {
        return []
    }

    const requests = await prisma.leaveRequest.findMany({
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                    image: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    })

    return requests
}

// Helpers
function calculateLeaveDays(startDate: Date, endDate: Date, startAmPm: string, endAmPm: string): number {
    const start = new Date(startDate)
    const end = new Date(endDate)
    start.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)

    let days = 0
    let current = new Date(start)

    while (current <= end) {
        // Skip weekends (0 = Sunday, 6 = Saturday)
        const dayOfWeek = current.getDay()
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            days += 1
        }
        current.setDate(current.getDate() + 1)
    }

    if (days === 0) return 0

    // Adjust for half days
    if (startAmPm === 'Après-midi') days -= 0.5
    if (endAmPm === 'Matin') days -= 0.5

    return Math.max(0, days)
}

export async function getMyLeaveBalances() {
    // Default allocations
    const balances = {
        CP: { max: 25, consumed: 0 },
        MA: { max: 0, consumed: 0 }, // No theoretical limit, just tracking
        CSS: { max: 6, consumed: 0 }
    }

    const session = await auth()
    if (!session?.user?.email) return balances

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    })
    if (!user) return balances

    // Only count APPROVED leave requests towards the consumed balance
    const approvedRequests = await prisma.leaveRequest.findMany({
        where: {
            userId: user.id,
            status: 'APPROVED'
        }
    })

    approvedRequests.forEach((req: any) => {
        const consumedDays = calculateLeaveDays(req.startDate, req.endDate, req.startAmPm, req.endAmPm)

        if (req.type === 'CP') balances.CP.consumed += consumedDays
        else if (req.type === 'MA') balances.MA.consumed += consumedDays
        else if (req.type === 'CSS') balances.CSS.consumed += consumedDays
    })

    return balances
}

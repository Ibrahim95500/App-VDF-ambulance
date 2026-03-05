import { prisma } from "@/lib/prisma"
import { Prisma, RequestStatus, AppointmentType, Role, RescheduleStatus } from "@prisma/client"

export type RescheduleEventAction = 'PROPOSE' | 'ACCEPT' | 'REJECT'

export interface RescheduleEvent {
    date: string
    actor: 'SALARIE' | 'RH'
    action: RescheduleEventAction
    proposedDate?: string
    message?: string
}

export async function createAppointmentRequest(data: {
    userId: string
    reason: string
    description?: string
    type?: AppointmentType
    initiator?: Role
    appointmentDate?: Date
    appointmentMode?: string
    adminComment?: string
    status?: RequestStatus
}) {
    return prisma.appointmentRequest.create({
        data: {
            ...data,
            rescheduleHistory: []
        },
    })
}

export async function getAppointmentRequests() {
    return prisma.appointmentRequest.findMany({
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    image: true,
                    phone: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    })
}

export async function getAppointmentRequestsByUser(userId: string) {
    return prisma.appointmentRequest.findMany({
        where: { userId },
        orderBy: {
            createdAt: 'desc'
        }
    })
}

export async function getAppointmentRequestById(id: string) {
    return prisma.appointmentRequest.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                }
            }
        }
    })
}

export async function updateAppointmentRequestStatus(
    id: string,
    status: RequestStatus,
    adminComment?: string,
    appointmentDate?: Date,
    appointmentMode?: string
) {
    return prisma.appointmentRequest.update({
        where: { id },
        data: {
            status,
            adminComment,
            appointmentDate,
            appointmentMode
        },
        include: {
            user: true
        }
    })
}

export async function requestReschedule(
    id: string,
    proposedDate: Date,
    message: string,
    historyAction: RescheduleEvent
) {
    const request = await prisma.appointmentRequest.findUnique({ where: { id } })
    if (!request) throw new Error("Requête non trouvée")

    const history = Array.isArray(request.rescheduleHistory) ? request.rescheduleHistory : []

    return prisma.appointmentRequest.update({
        where: { id },
        data: {
            rescheduleStatus: 'PENDING',
            rescheduleHistory: [...history, historyAction] as Prisma.InputJsonArray
        },
        include: { user: true }
    })
}

export async function replyToReschedule(
    id: string,
    action: 'ACCEPT' | 'REJECT',
    historyAction: RescheduleEvent,
    newAppointmentDate?: Date
) {
    const request = await prisma.appointmentRequest.findUnique({ where: { id } })
    if (!request) throw new Error("Requête non trouvée")

    const history = Array.isArray(request.rescheduleHistory) ? request.rescheduleHistory : []

    const data: any = {
        rescheduleStatus: action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED',
        rescheduleHistory: [...history, historyAction] as Prisma.InputJsonArray
    }

    if (action === 'ACCEPT' && newAppointmentDate) {
        data.appointmentDate = newAppointmentDate
    }

    return prisma.appointmentRequest.update({
        where: { id },
        data,
        include: { user: true }
    })
}

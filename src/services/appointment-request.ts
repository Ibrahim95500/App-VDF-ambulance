import { prisma } from "@/lib/prisma"
import { RequestStatus } from "@prisma/client"

export async function createAppointmentRequest(data: {
    userId: string
    reason: string
    description?: string
}) {
    return prisma.appointmentRequest.create({
        data,
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

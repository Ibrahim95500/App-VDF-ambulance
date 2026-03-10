"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import type { AssignmentStatus } from "@prisma/client"

export async function getVehiclesWithAssignments(date: Date) {
    const startOfTargetDate = new Date(date)
    startOfTargetDate.setHours(0, 0, 0, 0)

    const endOfTargetDate = new Date(date)
    endOfTargetDate.setHours(23, 59, 59, 999)

    return prisma.vehicle.findMany({
        include: {
            assignments: {
                where: {
                    date: {
                        gte: startOfTargetDate,
                        lte: endOfTargetDate
                    }
                },
                include: {
                    leader: true,
                    teammate: true
                }
            }
        },
        orderBy: {
            plateNumber: 'asc'
        }
    })
}

export async function getAvailablePersonnel(date: Date) {
    // Dans une version plus complexe, on filtrerait ceux qui ne sont pas déjà assignés
    // ou ceux qui sont en repos (LeaveRequest)
    return prisma.user.findMany({
        where: {
            role: 'SALARIE',
            isActive: true
        },
        orderBy: {
            lastName: 'asc'
        }
    })
}

export async function saveAssignment(data: {
    vehicleId: string
    leaderId: string
    teammateId: string
    date: Date
    startTime?: string
    endTime?: string
}) {
    try {
        const startOfDay = new Date(data.date)
        startOfDay.setHours(0, 0, 0, 0)

        const endOfDay = new Date(data.date)
        endOfDay.setHours(23, 59, 59, 999)

        // On cherche s'il existe déjà une assignation pour ce véhicule à cette date
        const existing = await prisma.planningAssignment.findFirst({
            where: {
                vehicleId: data.vehicleId,
                date: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        })

        if (existing) {
            await prisma.planningAssignment.update({
                where: { id: existing.id },
                data: {
                    leaderId: data.leaderId,
                    teammateId: data.teammateId,
                    startTime: data.startTime,
                    endTime: data.endTime,
                    status: 'PENDING' // On repasse en pending si on modifie
                }
            })
        } else {
            await prisma.planningAssignment.create({
                data: {
                    vehicleId: data.vehicleId,
                    leaderId: data.leaderId,
                    teammateId: data.teammateId,
                    date: data.date,
                    startTime: data.startTime,
                    endTime: data.endTime,
                    status: 'PENDING'
                }
            })
        }

        revalidatePath('/dashboard/rh/regulation')
        return { success: true }
    } catch (error: any) {
        console.error("Erreur saveAssignment:", error)
        return { error: error.message }
    }
}

export async function updateAssignmentStatus(assignmentId: string, status: AssignmentStatus) {
    try {
        await prisma.planningAssignment.update({
            where: { id: assignmentId },
            data: { status }
        })

        revalidatePath('/dashboard/rh/regulation')
        revalidatePath('/dashboard/salarie')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function getMyAssignment(userId: string, date: Date) {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    return prisma.planningAssignment.findFirst({
        where: {
            OR: [
                { leaderId: userId },
                { teammateId: userId }
            ],
            date: {
                gte: startOfDay,
                lte: endOfDay
            }
        },
        include: {
            vehicle: true,
            leader: true,
            teammate: true
        }
    })
}

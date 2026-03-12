"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import type { AssignmentStatus } from "@prisma/client"

export async function getVehiclesWithAssignments(dateStr: string) {
    try {
        const startOfTargetDate = new Date(`${dateStr}T00:00:00.000Z`)
        const endOfTargetDate = new Date(`${dateStr}T23:59:59.999Z`)

        return await prisma.vehicle.findMany({
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
    } catch (error) {
        console.error("Erreur getVehiclesWithAssignments:", error)
        return []
    }
}

export async function getAvailablePersonnel(dateStr: string) {
    // Dans une version plus complexe, on filtrerait ceux qui ne sont pas déjà assignés
    // ou ceux qui sont en repos (LeaveRequest)
    return prisma.user.findMany({
        where: {
            OR: [
                { roles: { has: 'SALARIE' } },
                { roles: { has: 'REGULATEUR' } }
            ],
            isActive: true
        } as any,
        select: {
            id: true,
            firstName: true,
            lastName: true,
            diploma: true,
            isTeamLeader: true,
            structure: true,
            oubliCount: true,
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
    dateStr: string
    startTime?: string
    endTime?: string
}) {
    try {
        const startOfDay = new Date(`${data.dateStr}T00:00:00.000Z`)
        const endOfDay = new Date(`${data.dateStr}T23:59:59.999Z`)

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
                    status: 'PENDING',
                    leaderValidated: false,
                    teammateValidated: false
                }
            })
        } else {
            await prisma.planningAssignment.create({
                data: {
                    vehicleId: data.vehicleId,
                    leaderId: data.leaderId,
                    teammateId: data.teammateId,
                    date: startOfDay,
                    startTime: data.startTime,
                    endTime: data.endTime,
                    status: 'PENDING',
                    leaderValidated: false,
                    teammateValidated: false
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

export async function validateMyPlanning(userId: string, assignmentId: string) {
    try {
        const assignment = await prisma.planningAssignment.findUnique({
            where: { id: assignmentId }
        })
        if (!assignment) return { error: 'Assignment introuvable' }

        // Détermine si le user est leader ou teammate
        const isLeader = assignment.leaderId === userId
        const isTeammate = assignment.teammateId === userId
        if (!isLeader && !isTeammate) return { error: 'Non autorisé' }

        const updateField = isLeader ? { leaderValidated: true } : { teammateValidated: true }

        const updated = await prisma.planningAssignment.update({
            where: { id: assignmentId },
            data: updateField
        })

        // Si les 2 ont validé → status VALIDATED
        if (updated.leaderValidated && updated.teammateValidated) {
            await prisma.planningAssignment.update({
                where: { id: assignmentId },
                data: { status: 'VALIDATED' }
            })
        }

        revalidatePath('/dashboard/rh/regulation')
        revalidatePath('/dashboard/salarie')
        return { success: true }
    } catch (error: any) {
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

export async function getMyAssignment(userId: string, dateStr: string) {
    try {
        const startOfDay = new Date(`${dateStr}T00:00:00.000Z`)
        const endOfDay = new Date(`${dateStr}T23:59:59.999Z`)

        return await prisma.planningAssignment.findFirst({
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
    } catch (error) {
        console.error("Erreur getMyAssignment:", error)
        return null
    }
}

export async function getRegulationHistory() {
    try {
        const history = await prisma.planningAssignment.findMany({
            orderBy: {
                date: 'desc'
            },
            include: {
                vehicle: true,
                leader: true,
                teammate: true
            }
        })
        return history;
    } catch (error: any) {
        console.error("Error getRegulationHistory:", error);
        return [];
    }
}
export async function getMyRegulationHistory(userId: string) {
    try {
        return await prisma.planningAssignment.findMany({
            where: {
                OR: [
                    { leaderId: userId },
                    { teammateId: userId }
                ]
            },
            include: {
                vehicle: true,
                leader: true,
                teammate: true
            },
            orderBy: {
                date: 'desc'
            },
            take: 10 // On limite aux 10 dernières missions pour la lisibilité
        })
    } catch (error) {
        console.error("Erreur getMyRegulationHistory:", error);
        return [];
    }
}

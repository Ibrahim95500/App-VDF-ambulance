"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import type { AssignmentStatus } from "@prisma/client"
import { sendBrandedEmail } from "@/lib/mail"
import { createNotification } from "@/actions/notifications.actions"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export async function getVehiclesWithAssignments(dateStr: string, shift: 'JOUR' | 'NUIT' = 'JOUR') {
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
                        },
                        startTime: shift === 'JOUR' ? { lt: "12:00" } : { gte: "12:00" }
                    },
                    include: {
                        leader: true,
                        teammate: true
                    },
                    orderBy: {
                        startTime: 'asc'
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
                { roles: { has: 'REGULATEUR' } },
                { roles: { has: 'ADMIN' } }
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
            isRegulateur: true,
            roles: true,
            shift: true,
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

        const isNight = !!data.startTime && data.startTime >= "12:00"

        // --- VALIDATION JOUR / NUIT ---
        // On vérifie si l'un des deux est déjà assigné sur l'autre shift (ou celui-ci d'ailleurs) ce jour là
        const personIds = [data.leaderId, data.teammateId].filter(id => id !== "")
        
        for (const pid of personIds) {
            const otherAssignment = await prisma.planningAssignment.findFirst({
                where: {
                    date: { gte: startOfDay, lte: endOfDay },
                    OR: [{ leaderId: pid }, { teammateId: pid }],
                    // On cherche spécifiquement un conflit (si on est Night, on cherche s'il est déjà en Day et vice versa)
                    // Mais en réalité, le client demande "ne peut pas être de nuit s'il est de jour", donc n'importe quel autre assignment le même jour est suspect
                    // Sauf si c'est pour le MÊME véhicule (modification d'équipage en cours)
                    vehicleId: { not: data.vehicleId }, 
                    startTime: isNight ? { lt: "12:00" } : { gte: "12:00" }
                },
                include: { vehicle: true }
            })

            if (otherAssignment) {
                const user = await prisma.user.findUnique({ where: { id: pid }, select: { firstName: true, lastName: true } })
                throw new Error(`🚫 CONFLIT JOUR/NUIT : ${user?.lastName} ${user?.firstName} est déjà assigné sur le véhicule ${otherAssignment.vehicleId} (${otherAssignment.vehicle.plateNumber}) en vacation ${isNight ? 'du MATIN' : 'du SOIR'}. Un salarié ne peut pas faire les deux vacations le même jour.`)
            }
        }
        
        // On cherche s'il existe déjà une assignation pour ce véhicule à cette date (et sur le BON créneau)
        const existing = await prisma.planningAssignment.findFirst({
            where: {
                vehicleId: data.vehicleId,
                date: {
                    gte: startOfDay,
                    lte: endOfDay
                },
                startTime: isNight ? { gte: "12:00" } : { lt: "12:00" }
            }
        })

        let assignmentId = ""

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
                    leaderValidatedAt: null,
                    teammateValidated: false,
                    teammateValidatedAt: null
                }
            })
            assignmentId = existing.id
        } else {
            const created = await prisma.planningAssignment.create({
                data: {
                    vehicleId: data.vehicleId,
                    leaderId: data.leaderId,
                    teammateId: data.teammateId,
                    date: startOfDay,
                    startTime: data.startTime,
                    endTime: data.endTime,
                    status: 'PENDING',
                    leaderValidated: false,
                    leaderValidatedAt: null,
                    teammateValidated: false,
                    teammateValidatedAt: null
                }
            })
            assignmentId = created.id
        }

        // --- NOTIFICATIONS ---
        const formattedDate = format(startOfDay, 'EEEE d MMMM', { locale: fr })
        for (const pid of personIds) {
            await createNotification({
                userId: pid,
                title: "Nouvelle Mission Disponible",
                message: `Vous avez été affecté au véhicule ${data.vehicleId} pour le ${formattedDate} (${isNight ? 'Nuit' : 'Jour'}). Merci de valider.`,
                type: "MISSION",
                link: "/dashboard/salarie/regulation"
            }).catch(console.error)
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
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', hour12: false });
        const currentHour = parseInt(formatter.format(now));
        
        if (currentHour < 19 || currentHour >= 21) {
            return { error: "La validation n'est autorisée qu'entre 19h00 et 21h00." }
        }

        const assignment = await prisma.planningAssignment.findUnique({
            where: { id: assignmentId }
        })
        if (!assignment) return { error: 'Assignment introuvable' }

        // Détermine si le user est leader ou teammate
        const isLeader = assignment.leaderId === userId
        const isTeammate = assignment.teammateId === userId
        if (!isLeader && !isTeammate) return { error: 'Non autorisé' }

        const updateField = isLeader 
            ? { leaderValidated: true, leaderValidatedAt: new Date() } 
            : { teammateValidated: true, teammateValidatedAt: new Date() }
    
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
            orderBy: [
                { date: 'desc' },
                { createdAt: 'desc' }
            ],
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
            orderBy: [
                { date: 'desc' },
                { createdAt: 'desc' }
            ],
            take: 10 // On limite aux 10 dernières missions pour la lisibilité
        })
    } catch (error) {
        console.error("Erreur getMyRegulationHistory:", error);
        return [];
    }
}

// ----- NOUVELLES ACTIONS RÉGULATION & DISPO ----- //

export async function deletePlanningAssignment(id: string) {
    try {
        await prisma.planningAssignment.delete({ where: { id } })
        revalidatePath('/dashboard/rh/regulation')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function getRegulationAssignments(dateStr: string) {
    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`)
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`)
    return prisma.regulationAssignment.findMany({
        where: { date: { gte: startOfDay, lte: endOfDay } },
        include: { user: true },
        orderBy: { startTime: 'asc' }
    })
}

export async function saveRegulationAssignment(data: { userId: string, dateStr: string, type: string, startTime: string }) {
    try {
        const startOfDay = new Date(`${data.dateStr}T00:00:00.000Z`)
        await prisma.regulationAssignment.create({
            data: {
                userId: data.userId,
                date: startOfDay,
                type: data.type as any,
                startTime: data.startTime
            }
        })
        
        // Notification & Email to User
        const user = await prisma.user.findUnique({ where: { id: data.userId }, select: { email: true, firstName: true, lastName: true } })
        if (user) {
            const formattedDate = format(startOfDay, 'EEEE d MMMM yyyy', { locale: fr })
            if (user.email) {
                await sendBrandedEmail({
                    to: user.email,
                    from: '"Direction RH VDF" <vdf95rh@gmail.com>',
                    subject: `📞 Vous êtes assigné au Poste de Régulation`,
                    title: "Poste de Régulation",
                    preheader: `Assignation pour le ${formattedDate}`,
                    content: `
                        <h2>Bonjour ${user.firstName || ''},</h2>
                        <p>Vous avez été désigné comme Régulateur (${data.type}) pour le <strong>${formattedDate}</strong> à partir de <strong>${data.startTime}</strong>.</p>
                        <p>Veuillez vous connecter à l'application pour valider votre présence d'ici 23h59 la veille au soir.</p>
                    `
                }).catch(console.error)
            }
            await createNotification({
                userId: data.userId,
                title: "Poste de Régulation",
                message: `Vous êtes affecté à la régulation le ${formattedDate} à ${data.startTime}. N'oubliez pas de valider.`,
                type: "MISSION"
            }).catch(console.error)
        }

        revalidatePath('/dashboard/rh/regulation')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function deleteRegulationAssignment(id: string) {
    try {
        await prisma.regulationAssignment.delete({ where: { id } })
        revalidatePath('/dashboard/rh/regulation')
        return { success: true }
    } catch (error: any) { return { error: error.message } }
}

export async function getDisponibilities(dateStr: string) {
    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`)
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`)
    return prisma.disponibility.findMany({
        where: { date: { gte: startOfDay, lte: endOfDay } },
        include: { user: true },
        orderBy: { startTime: 'asc' }
    })
}

export async function saveDisponibility(data: { userId: string, dateStr: string, startTime: string }) {
    try {
        const startOfDay = new Date(`${data.dateStr}T00:00:00.000Z`)
        await prisma.disponibility.create({
            data: {
                userId: data.userId,
                date: startOfDay,
                startTime: data.startTime
            }
        })

        // Notification & Email to User
        const user = await prisma.user.findUnique({ where: { id: data.userId }, select: { email: true, firstName: true, lastName: true } })
        if (user) {
            const formattedDate = format(startOfDay, 'EEEE d MMMM yyyy', { locale: fr })
            if (user.email) {
                await sendBrandedEmail({
                    to: user.email,
                    from: '"Direction RH VDF" <vdf95rh@gmail.com>',
                    subject: `⏱ Vous êtes placé en Employé Disponible`,
                    title: `Employé Disponible`,
                    preheader: `Astreinte pour le ${formattedDate}`,
                    content: `
                        <h2>Bonjour ${user.firstName || ''},</h2>
                        <p>Vous avez été positionné comme "Employé Disponible" pour le <strong>${formattedDate}</strong> à partir de <strong>${data.startTime}</strong>.</p>
                        <p>Veuillez vous connecter à l'application pour valider votre présence d'ici 23h59 la veille au soir. Un régulateur vous affectera à un véhicule en cours de journée.</p>
                    `
                }).catch(console.error)
            }
            await createNotification({
                userId: data.userId,
                title: "Employé Disponible",
                message: `Vous êtes d'astreinte/disponible le ${formattedDate} à ${data.startTime}. N'oubliez pas de valider.`,
                type: "MISSION"
            }).catch(console.error)
        }

        revalidatePath('/dashboard/rh/regulation')
        return { success: true }
    } catch (error: any) { return { error: error.message } }
}

export async function deleteDisponibility(id: string) {
    try {
        await prisma.disponibility.delete({ where: { id } })
        revalidatePath('/dashboard/rh/regulation')
        return { success: true }
    } catch (error: any) { return { error: error.message } }
}

export async function updateDisponibility(id: string, data: { startTime: string }) {
    try {
        await prisma.disponibility.update({
            where: { id },
            data: { startTime: data.startTime }
        })
        revalidatePath('/dashboard/rh/regulation')
        return { success: true }
    } catch (error: any) { 
        return { error: error.message } 
    }
}

export async function integrateDispoToCrew(
    dispoId: string, 
    assignmentId: string, 
    newUserId: string, 
    replacedUserId: string, 
    integrationTime: string
) {
    try {
        const existingAssignment = await prisma.planningAssignment.findUnique({
            where: { id: assignmentId }
        })
        if (!existingAssignment) throw new Error("Équipage introuvable")

        // 1. Clôturer l'ancien relais (le gars qui finit à 15h)
        await prisma.planningAssignment.update({
            where: { id: assignmentId },
            data: { endTime: integrationTime }
        })

        // 2. Créer la nouvelle ligne d'affectation pour prendre le relais
        const isReplacingLeader = existingAssignment.leaderId === replacedUserId;
        await prisma.planningAssignment.create({
            data: {
                vehicleId: existingAssignment.vehicleId,
                date: existingAssignment.date,
                startTime: integrationTime,
                endTime: existingAssignment.endTime, // Optionnel, s'aligne sur la fin initiale prévue du véhicule
                leaderId: isReplacingLeader ? newUserId : existingAssignment.leaderId,
                teammateId: !isReplacingLeader ? newUserId : existingAssignment.teammateId,
                status: 'PENDING',
                leaderValidated: false,
                teammateValidated: false
            }
        })

        // 3. Mettre à jour le statut "Intégré" pour la dispo
        await prisma.disponibility.update({
            where: { id: dispoId },
            data: { status: 'INTEGRATED' }
        })

        // 4. Notification
        const formattedDate = format(existingAssignment.date, 'EEEE d MMMM', { locale: fr })
        await createNotification({
            userId: newUserId,
            title: "Relève Planning",
            message: `Vous avez été intégré au véhicule ${existingAssignment.vehicleId} pour une relève à ${integrationTime} le ${formattedDate}.`,
            type: "MISSION",
            link: "/dashboard/salarie/regulation"
        }).catch(console.error)

        revalidatePath('/dashboard/rh/regulation')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function getMyRegulation(userId: string, dateStr: string) {
    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`)
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`)
    return prisma.regulationAssignment.findFirst({
        where: { userId, date: { gte: startOfDay, lte: endOfDay } }
    })
}

export async function getMyDisponibility(userId: string, dateStr: string) {
    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`)
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`)
    return prisma.disponibility.findFirst({
        where: { userId, date: { gte: startOfDay, lte: endOfDay } }
    })
}

export async function validateMyRegulation(userId: string, id: string) {
    try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', hour12: false });
        const currentHour = parseInt(formatter.format(now));
        
        if (currentHour < 19 || currentHour >= 21) {
            return { error: "La validation n'est autorisée qu'entre 19h00 et 21h00." }
        }

        const reg = await prisma.regulationAssignment.findUnique({ where: { id }, include: { user: true } })
        if (!reg || reg.userId !== userId) throw new Error("Accès refusé")
        await prisma.regulationAssignment.update({
            where: { id },
            data: { validated: true, validatedAt: new Date() }
        })

        // Notification & Email to ADMIN
        const admins = await prisma.user.findMany({ where: { roles: { has: 'ADMIN' } }, select: { id: true, email: true } })
        const formattedDate = format(reg.date, 'dd/MM/yyyy')
        for (const admin of admins) {
            if (admin.email) {
                await sendBrandedEmail({
                    to: admin.email,
                    from: '"App VDF" <vdf95rh@gmail.com>',
                    subject: `✅ Régulation Validée - ${reg.user?.lastName} ${reg.user?.firstName}`,
                    title: `Régulation Validée`,
                    preheader: `${reg.user?.lastName} a validé ${formattedDate}`,
                    content: `<p>Le collaborateur <strong>${reg.user?.lastName} ${reg.user?.firstName}</strong> a validé son poste de régulateur pour le <strong>${formattedDate}</strong> (${reg.startTime}).</p>`
                }).catch(console.error)
            }
            await createNotification({
                userId: admin.id,
                title: "Régulation Validée",
                message: `${reg.user?.lastName} a validé son poste de régulateur pour le ${formattedDate}.`,
                type: "MISSION"
            }).catch(console.error)
        }

        revalidatePath('/dashboard/rh/regulation')
        revalidatePath('/dashboard/salarie')
        return { success: true }
    } catch (e: any) { return { error: e.message } }
}

export async function validateMyDispo(userId: string, id: string) {
    try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', hour12: false });
        const currentHour = parseInt(formatter.format(now));
        
        if (currentHour < 19 || currentHour >= 21) {
            return { error: "La validation n'est autorisée qu'entre 19h00 et 21h00." }
        }

        const dispo = await prisma.disponibility.findUnique({ where: { id }, include: { user: true } })
        if (!dispo || dispo.userId !== userId) throw new Error("Accès refusé")
        await prisma.disponibility.update({
            where: { id },
            data: { validated: true, validatedAt: new Date() }
        })

        // Notification & Email to ADMIN
        const admins = await prisma.user.findMany({ where: { OR: [{ roles: { has: 'ADMIN' } }, { isRegulateur: true }] }, select: { id: true, email: true } })
        const formattedDate = format(dispo.date, 'dd/MM/yyyy')
        for (const admin of admins) {
            if (admin.email) {
                await sendBrandedEmail({
                    to: admin.email,
                    from: '"App VDF" <vdf95rh@gmail.com>',
                    subject: `✅ Dispo Validée - ${dispo.user?.lastName} ${dispo.user?.firstName}`,
                    title: `Dispo Validée`,
                    preheader: `${dispo.user?.lastName} a validé ${formattedDate}`,
                    content: `<p>Le collaborateur <strong>${dispo.user?.lastName} ${dispo.user?.firstName}</strong> a validé sa disponibilité (attente de placement) pour le <strong>${formattedDate}</strong> à partir de ${dispo.startTime}.</p>`
                }).catch(console.error)
            }
            await createNotification({
                userId: admin.id,
                title: "Dispo Validée",
                message: `${dispo.user?.lastName} a validé sa présence en tant que Dispo pour le ${formattedDate}.`,
                type: "MISSION"
            }).catch(console.error)
        }

        revalidatePath('/dashboard/rh/regulation')
        revalidatePath('/dashboard/salarie')
        return { success: true }
    } catch (e: any) { return { error: e.message } }
}

export async function detachDispoFromCrew(dispoId: string) {
    try {
        await prisma.disponibility.update({
            where: { id: dispoId },
            data: { status: 'AVAILABLE' }
        })
        revalidatePath('/dashboard/rh/regulation')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

"use server"

import { prisma } from "@/lib/prisma"
import { startOfDay, endOfDay, addDays } from "date-fns"

export async function getNotificationStats(userId?: string) {
    try {
        // Stats pour l'administration (Global)
        const [
            pendingAdvances,
            pendingServices,
            pendingAppointments,
            pendingLeaves
        ] = await Promise.all([
            prisma.advanceRequest.count({ where: { status: 'PENDING' } }),
            prisma.serviceRequest.count({ where: { status: 'PENDING' } }),
            prisma.appointmentRequest.count({ where: { status: 'PENDING' } }),
            prisma.leaveRequest.count({ where: { status: 'PENDING' } })
        ]);

        // Stats spécifiques à l'utilisateur (pour ses propres démarches)
        let myAdvances = 0;
        let myServices = 0;
        let myAppointments = 0;
        let myLeaves = 0;
        let myMission = 0;

        if (userId) {
            const [adv, serv, appt, leave] = await Promise.all([
                prisma.advanceRequest.count({ where: { userId, status: 'PENDING' } }),
                prisma.serviceRequest.count({ where: { userId, status: 'PENDING' } }),
                prisma.appointmentRequest.count({ where: { userId, status: 'PENDING' } }),
                prisma.leaveRequest.count({ where: { userId, status: 'PENDING' } })
            ]);
            myAdvances = adv;
            myServices = serv;
            myAppointments = appt;
            myLeaves = leave;

            // Mission pour demain
            const tomorrow = addDays(new Date(), 1);
            const missionCount = await prisma.planningAssignment.count({
                where: {
                    date: {
                        gte: startOfDay(tomorrow),
                        lte: endOfDay(tomorrow)
                    },
                    OR: [
                        { leaderId: userId },
                        { teammateId: userId }
                    ]
                }
            });
            myMission = missionCount > 0 ? 1 : 0;
        }

        // Stats Régulation (RH) : Validations manquantes pour demain
        const tomorrow = addDays(new Date(), 1);
        const assignmentsTomorrow = await prisma.planningAssignment.findMany({
            where: {
                date: {
                    gte: startOfDay(tomorrow),
                    lte: endOfDay(tomorrow)
                }
            }
        });

        let validationPending = 0;
        const now = new Date();
        const isAfterCutoff = now.getHours() > 23 || (now.getHours() === 23 && now.getMinutes() >= 30);

        if (!isAfterCutoff) {
            assignmentsTomorrow.forEach((a: any) => {
                if (a.leaderId && !a.leaderValidated) validationPending++;
                if (a.teammateId && !a.teammateValidated) validationPending++;
            });
        }

        return {
            global: {
                advances: pendingAdvances,
                services: pendingServices,
                appointments: pendingAppointments,
                leaves: pendingLeaves,
                regulation: validationPending, // Les validations manquantes
                total: pendingAdvances + pendingServices + pendingAppointments + pendingLeaves + validationPending
            },
            personal: {
                advances: myAdvances,
                services: myServices,
                appointments: myAppointments,
                leaves: myLeaves,
                mission: myMission,
                total: myAdvances + myServices + myAppointments + myLeaves + myMission
            }
        };
    } catch (error) {
        console.error("Error fetching notification stats:", error);
        return {
            global: { advances: 0, services: 0, appointments: 0, leaves: 0, regulation: 0, total: 0 },
            personal: { advances: 0, services: 0, appointments: 0, leaves: 0, mission: 0, total: 0 }
        };
    }
}

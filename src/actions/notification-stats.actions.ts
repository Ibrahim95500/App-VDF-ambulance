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
            pendingLeaves,
            pendingGlobalSupport
        ] = await Promise.all([
            prisma.advanceRequest.count({ where: { status: 'PENDING' } }),
            prisma.serviceRequest.count({ where: { status: 'PENDING' } }),
            prisma.appointmentRequest.count({ where: { status: 'PENDING' } }),
            prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
            prisma.supportTicket.count({ where: { status: 'OPEN' } })
        ]);

        // Stats spécifiques à l'utilisateur (pour ses propres démarches)
        let myAdvances = 0;
        let myServices = 0;
        let myAppointments = 0;
        let myLeaves = 0;
        let myMission = 0;

        if (userId) {
            const [adv, serv, appt, leave, support] = await Promise.all([
                prisma.advanceRequest.count({ where: { userId, status: 'PENDING' } }),
                prisma.serviceRequest.count({ where: { userId, status: 'PENDING' } }),
                prisma.appointmentRequest.count({ where: { userId, status: 'PENDING' } }),
                prisma.leaveRequest.count({ where: { userId, status: 'PENDING' } }),
                prisma.supportTicket.count({ where: { userId, status: { in: ['RESOLVED', 'IN_PROGRESS'] } } })
            ]);
            myAdvances = adv;
            myServices = serv;
            myAppointments = appt;
            myLeaves = leave;
            let mySupport = support;

            // Mission pour demain (non validée)
            const tomorrow = addDays(new Date(), 1);
            const [pendingMissionCount, pendingRegulCount, pendingDispoCount] = await Promise.all([
                prisma.planningAssignment.count({
                    where: {
                        date: { gte: startOfDay(tomorrow), lte: endOfDay(tomorrow) },
                        OR: [
                            { leaderId: userId, leaderValidated: false },
                            { teammateId: userId, teammateValidated: false }
                        ]
                    }
                }),
                prisma.regulationAssignment.count({
                    where: { userId, date: { gte: startOfDay(tomorrow), lte: endOfDay(tomorrow) }, validated: false }
                }),
                prisma.disponibility.count({
                    where: { userId, date: { gte: startOfDay(tomorrow), lte: endOfDay(tomorrow) }, validated: false }
                })
            ]);
            myMission = (pendingMissionCount + pendingRegulCount + pendingDispoCount) > 0 ? 1 : 0;
        }

        const tomorrow = addDays(new Date(), 1);
        const [assignmentsTomorrow, regulationAssignments, disponibilities] = await Promise.all([
            prisma.planningAssignment.findMany({
                where: { date: { gte: startOfDay(tomorrow), lte: endOfDay(tomorrow) } }
            }),
            prisma.regulationAssignment.findMany({
                where: { date: { gte: startOfDay(tomorrow), lte: endOfDay(tomorrow) } }
            }),
            prisma.disponibility.findMany({
                where: { date: { gte: startOfDay(tomorrow), lte: endOfDay(tomorrow) } }
            })
        ]);

        let validationPending = 0;
        assignmentsTomorrow.forEach((a: any) => {
            if (a.leaderId && !a.leaderValidated) validationPending++;
            if (a.teammateId && !a.teammateValidated) validationPending++;
        });

        regulationAssignments.forEach((ra: any) => {
            if (!ra.validated) validationPending++;
        });
        
        disponibilities.forEach((d: any) => {
            if (!d.validated) validationPending++;
        });

        return {
            global: {
                advances: pendingAdvances,
                services: pendingServices,
                appointments: pendingAppointments,
                leaves: pendingLeaves,
                regulation: validationPending, 
                support: pendingGlobalSupport,
                total: pendingAdvances + pendingServices + pendingAppointments + pendingLeaves + validationPending + pendingGlobalSupport
            },
            personal: {
                advances: myAdvances,
                services: myServices,
                appointments: myAppointments,
                leaves: myLeaves,
                mission: myMission,
                support: mySupport,
                total: myAdvances + myServices + myAppointments + myLeaves + myMission + mySupport
            }
        };
    } catch (error) {
        console.error("Error fetching notification stats:", error);
        return {
            global: { advances: 0, services: 0, appointments: 0, leaves: 0, regulation: 0, support: 0, total: 0 },
            personal: { advances: 0, services: 0, appointments: 0, leaves: 0, mission: 0, support: 0, total: 0 }
        };
    }
}

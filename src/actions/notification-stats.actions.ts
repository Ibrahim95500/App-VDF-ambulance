"use server"

import { prisma } from "@/lib/prisma"

export async function getNotificationStats() {
    try {
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

        return {
            advances: pendingAdvances,
            services: pendingServices,
            appointments: pendingAppointments,
            leaves: pendingLeaves,
            total: pendingAdvances + pendingServices + pendingAppointments + pendingLeaves
        };
    } catch (error) {
        console.error("Error fetching notification stats:", error);
        return {
            advances: 0,
            services: 0,
            appointments: 0,
            leaves: 0,
            total: 0
        };
    }
}

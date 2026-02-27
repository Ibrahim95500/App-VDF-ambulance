"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { LeaveType, RequestStatus } from "@prisma/client"
import { createNotification } from "./notifications.actions"
import { z } from "zod"

const LeaveRequestSchema = z.object({
    type: z.enum(["cp", "ma", "css"]),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format invalide"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format invalide"),
    startAmPm: z.string(),
    endAmPm: z.string(),
    reason: z.string().max(1000, "Le motif ne doit pas dépasser 1000 caractères").optional(),
});

export async function createLeaveRequest(
    type: string,
    startDate: string,
    endDate: string,
    startAmPm: string,
    endAmPm: string,
    reason?: string
) {
    const session = await auth()
    if (!session?.user?.id || !session?.user?.email) {
        throw new Error("Vous devez être connecté pour effectuer cette action.")
    }

    const validatedFields = LeaveRequestSchema.safeParse({
        type, startDate, endDate, startAmPm, endAmPm, reason
    })

    if (!validatedFields.success) {
        throw new Error(validatedFields.error.issues[0].message)
    }

    const { startDate: sD, endDate: eD, type: leaveType } = validatedFields.data;
    const start = new Date(sD);
    const end = new Date(eD);

    if (end < start) {
        throw new Error("La date de fin ne peut pas être antérieure à la date de début.");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (leaveType !== "ma" && start < today) {
        throw new Error("La date de début ne peut pas être dans le passé (sauf pour maladie).");
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    })

    if (!user) {
        throw new Error("Utilisateur introuvable.")
    }

    // Convert string 'type' into Prisma Enum Type
    let prismaType: LeaveType;
    if (type === 'cp') prismaType = LeaveType.CP;
    else if (type === 'ma') prismaType = LeaveType.MA;
    else if (type === 'css') prismaType = LeaveType.CSS;
    else throw new Error("Type de congé invalide.")

    const request = await prisma.leaveRequest.create({
        data: {
            userId: user.id,
            type: prismaType,
            startDate: start,
            endDate: end,
            startAmPm,
            endAmPm,
            reason
        }
    })

    // Notify all RH users
    const rhUsers = await prisma.user.findMany({ where: { role: 'RH' } })
    for (const rh of rhUsers) {
        await createNotification({
            userId: rh.id,
            title: "Nouvelle demande de congé",
            message: `${user.firstName} ${user.lastName} a soumis une demande de congé (${type.toUpperCase()}).`,
            type: "LEAVE",
            status: "PENDING",
            link: "/dashboard/rh"
        })
    }

    revalidatePath("/dashboard/salarie/conges")
    return { success: true, data: request }
}

export async function updateLeaveRequestStatus(requestId: string, status: 'APPROVED' | 'REJECTED') {
    const session = await auth()

    if (!session?.user || (session.user as any).role !== "RH") {
        throw new Error("Action non autorisée. Réservé aux RH.")
    }

    const updatedRequest = await prisma.leaveRequest.update({
        where: { id: requestId },
        data: { status: status as RequestStatus },
        include: { user: true }
    })

    // Notify the employee
    await createNotification({
        userId: updatedRequest.userId,
        title: `Demande de congé ${status === 'APPROVED' ? 'Approuvée' : 'Refusée'}`,
        message: `Votre demande de congé du ${new Date(updatedRequest.startDate).toLocaleDateString()} a été ${status === 'APPROVED' ? 'approuvée' : 'refusée'}.`,
        type: "LEAVE",
        status,
        link: "/dashboard/salarie/conges"
    })

    revalidatePath("/dashboard/rh")
    return { success: true, data: updatedRequest }
}

"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { createNotification } from "./notifications.actions"
import { z } from "zod"

const AdvanceRequestSchema = z.object({
    amount: z.number().positive("Le montant doit être positif").max(5000, "Le montant est trop élevé"),
    reason: z.string().max(500, "Le motif ne doit pas dépasser 500 caractères").optional(),
});

export async function updateRequestStatus(requestId: string, status: "APPROVED" | "REJECTED") {
    const session = await auth()

    // Security check: Only RH can approve/reject
    if ((session?.user as any)?.role !== "RH") {
        throw new Error("Unauthorized: Only RH can update request status")
    }

    const request = await prisma.advanceRequest.update({
        where: { id: requestId },
        data: { status },
        include: { user: true }
    })

    // Notify the employee
    await createNotification({
        userId: request.userId,
        title: `Demande d'acompte ${status === 'APPROVED' ? 'Approuvée' : 'Refusée'}`,
        message: `Votre demande d'acompte de ${request.amount}€ a été ${status === 'APPROVED' ? 'approuvée' : 'refusée'} par la RH.`,
        type: "ADVANCE",
        status,
        link: "/dashboard/salarie/acomptes"
    })

    revalidatePath('/dashboard/rh/acomptes')
    revalidatePath('/dashboard/salarie')
}

export async function createAdvanceRequest(amount: number, reason: string) {
    const session = await auth()

    if (!session?.user?.id) {
        throw new Error("Unauthorized")
    }

    // 15th of the month rule check
    const today = new Date()
    if (today.getDate() > 15) {
        throw new Error("Les demandes d'acompte ne sont possibles que du 1er au 15 du mois.")
    }

    // Target Month Calculation (Next Month)
    const targetDate = new Date(today.getFullYear(), today.getMonth() + 1, 1) // First day of next month
    const targetMonthString = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`

    // Frequency Rule: Only 1 request per target month
    const existingRequest = await prisma.advanceRequest.findFirst({
        where: {
            userId: session.user.id,
            targetMonth: targetMonthString
        }
    })

    if (existingRequest) {
        throw new Error("Vous avez déjà effectué une demande d'acompte pour ce mois cible.")
    }

    const validatedFields = AdvanceRequestSchema.safeParse({ amount, reason })
    if (!validatedFields.success) {
        throw new Error(validatedFields.error.issues[0].message)
    }

    const request = await prisma.advanceRequest.create({
        data: {
            amount,
            reason,
            targetMonth: targetMonthString,
            userId: session.user.id
        }
    })

    // Notify all RH users
    const rhUsers = await prisma.user.findMany({ where: { role: 'RH' } })
    for (const rh of rhUsers) {
        await createNotification({
            userId: rh.id,
            title: "Nouvelle demande d'acompte",
            message: `${session.user.name} a soumis une demande d'acompte de ${amount}€.`,
            type: "ADVANCE",
            status: "PENDING",
            link: "/dashboard/rh/acomptes"
        })
    }

    revalidatePath('/dashboard/rh/acomptes')
    revalidatePath('/dashboard/salarie')
}

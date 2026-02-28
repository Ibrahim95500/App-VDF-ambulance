"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { createNotification } from "./notifications.actions"
import { sendBrandedEmail } from "@/lib/mail"
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

    // Notify the employee via email
    if (request.user.email) {
        await sendBrandedEmail({
            to: request.user.email,
            subject: `Décision : Votre demande d'acompte`,
            title: `Demande ${status === 'APPROVED' ? 'Approuvée' : 'Refusée'}`,
            preheader: `Réponse à votre demande d'acompte`,
            content: `
                <p>Bonjour ${request.user.firstName || request.user.name},</p>
                <p>Votre demande d'acompte de <strong>${request.amount}€</strong> a été traitée.</p>
                <p>Le statut de votre demande est désormais : 
                   <strong style="color: ${status === 'APPROVED' ? '#16a34a' : '#dc2626'};">
                     ${status === 'APPROVED' ? 'APPROUVÉE' : 'REFUSÉE'}
                   </strong>.
                </p>
                <p>Vous pouvez consulter les détails dans votre espace personnel.</p>
            `,
            actionUrl: `${process.env.NEXTAUTH_URL}/dashboard/salarie`,
            actionText: "Accéder à mes demandes"
        });
    }

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
        },
        include: { user: true }
    })

    // Email notification to Admin
    try {
        await sendBrandedEmail({
            to: "ibrahim.nifa01@gmail.com",
            subject: `[Demande Acompte] ${request.user.name} - ${amount}€`,
            title: "Nouvelle Demande d'Acompte",
            preheader: `Nouvelle demande de ${request.user.name}`,
            content: `
                <p>Une nouvelle demande d'acompte a été soumise sur l'application.</p>
                <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
                    <p><strong>Collaborateur :</strong> ${request.user.name}</p>
                    <p><strong>Montant :</strong> ${amount}€</p>
                    <p><strong>Mois Cible :</strong> ${targetMonthString}</p>
                    <p><strong>Motif :</strong> ${reason || "-"}</p>
                </div>
            `,
            actionUrl: `${process.env.NEXTAUTH_URL}/dashboard/rh/acomptes`,
            actionText: "Voir la demande"
        });
        console.log(`Email notification sent for advance request: ${request.user.name}`);
    } catch (emailError) {
        console.error("Failed to send advance request email:", emailError);
    }

    revalidatePath('/dashboard/rh/acomptes')
    revalidatePath('/dashboard/salarie')
}

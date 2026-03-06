"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { createNotification, createManyNotifications } from "./notifications.actions"
import { sendPushNotification } from "./web-push.actions"
import { sendBrandedEmail } from "@/lib/mail"
import { z } from "zod"

const AdvanceRequestSchema = z.object({
    amount: z.number().positive("Le montant doit être positif").max(5000, "Le montant est trop élevé"),
    reason: z.string().max(500, "Le motif ne doit pas dépasser 500 caractères").optional(),
});

export async function updateRequestStatus(requestId: string, status: "APPROVED" | "REJECTED", comment?: string) {
    const session = await auth()

    // Security check: Only RH can approve/reject
    if ((session?.user as any)?.role !== "RH") {
        throw new Error("Unauthorized: Only RH can update request status")
    }

    const request = await prisma.advanceRequest.update({
        where: { id: requestId },
        data: { status, adminComment: comment },
        include: { user: true }
    })

    // Notify the employee in-app
    await createNotification({
        userId: request.userId,
        title: `Demande d'acompte ${status === 'APPROVED' ? 'Approuvée' : 'Refusée'}`,
        message: `Votre demande d'un montant de ${request.amount}€ a été ${status === 'APPROVED' ? 'acceptée' : 'refusée'}.`,
        type: "ADVANCE",
        status,
        link: "/dashboard/salarie"
    })

    // Send Web Push Notification
    await sendPushNotification(
        request.userId,
        `Demande d'acompte ${status === 'APPROVED' ? 'Approuvée' : 'Refusée'}`,
        `Votre demande d'un montant de ${request.amount}€ a été ${status === 'APPROVED' ? 'acceptée' : 'refusée'}.`,
        "/dashboard/salarie"
    )

    // Email au salarié
    if (request.user.email) {
        try {
            const employeeName = [request.user.firstName, request.user.lastName].filter(Boolean).join(' ') || request.user.name || request.user.email
            const approved = status === 'APPROVED'
            await sendBrandedEmail({
                to: request.user.email,
                from: '"App Ambulance" <ambulancemark@gmail.com>',
                replyTo: "ambulancemark@gmail.com",
                cc: "rezan.selva@gmail.com, ibrahim.nifa01@gmail.com",
                subject: `[Acompte] Votre demande de ${request.amount}€ a été ${approved ? 'approuvée' : 'refusée'}`,
                title: approved ? "Acompte Approuvé ✅" : "Acompte Refusé ❌",
                preheader: `Réponse à votre demande d'acompte de ${request.amount}€`,
                content: `
                    <p>Bonjour <strong>${employeeName}</strong>,</p>
                    <p>Votre demande d'acompte a été examinée par la Direction RH.</p>
                    <div style="background-color: ${approved ? '#f0fdf4' : '#fef2f2'}; padding: 20px; border-radius: 8px; border: 1px solid ${approved ? '#bbf7d0' : '#fecaca'}; margin: 20px 0;">
                        <p><strong>Montant demandé :</strong> ${request.amount}€</p>
                        <p><strong>Décision :</strong> <span style="color: ${approved ? '#16a34a' : '#dc2626'}; font-weight: bold;">${approved ? 'APPROUVÉE' : 'REFUSÉE'}</span></p>
                        ${comment ? `<p><strong>${approved ? 'Commentaire' : 'Motif du refus'} :</strong> <em>${comment}</em></p>` : ''}
                    </div>
                    <p style="font-size: 13px; color: #6b7280;">Connectez-vous à l'application pour consulter les détails.</p>
                `,
                actionUrl: `${process.env.NEXTAUTH_URL}/dashboard/salarie`,
                actionText: "Voir mon espace"
            })
        } catch (emailError) {
            console.error("Failed to send advance status email to employee:", emailError)
        }
    }

    revalidatePath('/dashboard/rh/acomptes')
    revalidatePath('/dashboard/salarie')
}

export async function createAdvanceRequest(amount: number, reason: string) {
    try {
        console.log(`[ACTION] createAdvanceRequest started - Amount: ${amount}, Reason: ${reason}`);
        const session = await auth()

        if (!session?.user?.id) {
            console.error("[ACTION] Unauthorized access attempt");
            return { success: false, error: "Non autorisé" }
        }

        // 15th of the month rule check
        const today = new Date()
        console.log(`[ACTION] Today's date: ${today.getDate()}`);
        if (today.getDate() > 15) {
            console.warn("[ACTION] Request attempted after the 15th");
            return { success: false, error: "Les demandes d'acompte ne sont possibles que du 1er au 15 du mois." }
        }

        // Target Month Calculation (Next Month)
        const targetDate = new Date(today.getFullYear(), today.getMonth() + 1, 1) // First day of next month
        const targetMonthName = targetDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        const targetMonthString = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`
        console.log(`[ACTION] Target Month: ${targetMonthString}`);

        // Frequency Rule: Only 1 request per target month
        const existingRequest = await prisma.advanceRequest.findFirst({
            where: {
                userId: session.user.id,
                targetMonth: targetMonthString
            }
        })

        if (existingRequest) {
            console.warn(`[ACTION] Duplicate request found for ${targetMonthString}`);
            return {
                success: false,
                error: `Vous avez déjà effectué une demande d'acompte qui sera déduite sur le salaire de ${targetMonthName}. Une seule demande par mois est autorisée.`
            }
        }

        const validatedFields = AdvanceRequestSchema.safeParse({ amount, reason })
        if (!validatedFields.success) {
            console.warn("[ACTION] Schema validation failed:", validatedFields.error.issues[0].message);
            return { success: false, error: validatedFields.error.issues[0].message }
        }

        console.log("[ACTION] Creating request in DB...");
        const request = await prisma.advanceRequest.create({
            data: {
                amount,
                reason,
                targetMonth: targetMonthString,
                userId: session.user.id
            },
            include: { user: true }
        })
        console.log("[ACTION] DB Request created successfully:", request.id);

        // 1. In-app notifications for RH & Employee
        console.log("[ACTION] Preparing notifications...");
        const rhUsers = await prisma.user.findMany({ where: { role: 'RH' } })
        const userName = request.user.name || `${request.user.firstName || ''} ${request.user.lastName || ''}`.trim() || request.user.email || "Utilisateur";

        const notifications: any[] = rhUsers.map(rh => ({
            userId: rh.id,
            title: "Nouvelle demande d'acompte",
            message: `${userName} a soumis une demande de ${amount}€.`,
            type: "ADVANCE",
            status: "PENDING",
            link: "/dashboard/rh/acomptes"
        }));

        // Add notification for the employee themselves
        notifications.push({
            userId: session.user.id,
            title: "Demande d'acompte soumise",
            message: `Votre demande de ${amount}€ a été envoyée aux RH.`,
            type: "ADVANCE",
            status: "PENDING",
            link: "/dashboard/salarie"
        });

        console.log(`[ACTION] Batch creating ${notifications.length} notifications...`);
        await createManyNotifications(notifications)
        console.log("[ACTION] Notifications created successfully.");

        // Send Push Notifications to RH
        for (const rh of rhUsers) {
            await sendPushNotification(
                rh.id,
                "Nouvelle demande d'acompte",
                `${userName} a soumis une demande de ${amount}€.`,
                "/dashboard/rh/acomptes"
            )
        }

        // 2. Email notification to Admin
        try {
            console.log("[ACTION] Sending email notification...");
            const senderFullName = request.user.name || `${request.user.firstName || ''} ${request.user.lastName || ''}`.trim() || request.user.email || "Utilisateur";
            await sendBrandedEmail({
                to: "ambulancemark@gmail.com",
                cc: "rezan.selva@gmail.com, ibrahim.nifa01@gmail.com",
                subject: `[Demande Acompte] ${senderFullName} - ${amount}€`,
                title: "Nouvelle Demande d'Acompte",
                preheader: `Nouvelle demande de ${senderFullName}`,
                content: `
                    <p>Une nouvelle demande d'acompte a été soumise sur l'application.</p>
                    <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
                        <p><strong>Collaborateur :</strong> ${senderFullName}</p>
                        <p><strong>Montant :</strong> ${amount}€</p>
                        <p><strong>Mois Cible :</strong> ${targetMonthName}</p>
                        <p><strong>Motif :</strong> ${reason || "-"}</p>
                    </div>
                    <p style="margin-top: 20px;">Cordialement,<br/><strong>${senderFullName}</strong></p>
                `,
                actionUrl: `${process.env.NEXTAUTH_URL}/dashboard/rh/acomptes`,
                actionText: "Voir la demande"
            });
            console.log(`Email notification sent for advance request: ${senderFullName}`);
        } catch (emailError) {
            console.error("[ACTION] Failed to send email:", emailError);
        }

        console.log("[ACTION] Revalidating paths...");
        try {
            revalidatePath('/dashboard/rh/acomptes')
            revalidatePath('/dashboard/salarie')
            revalidatePath('/', 'layout')
            console.log("[ACTION] Path revalidation complete.");
        } catch (revError) {
            console.error("[ACTION] Revalidation error:", revError);
        }

        console.log("[ACTION] createAdvanceRequest finished successfully.");
        return { success: true }
    } catch (err: any) {
        console.error("[ACTION] Unexpected failure in createAdvanceRequest:", err);
        return { success: false, error: "Une erreur serveur est survenue. Veuillez réessayer plus tard." }
    }
}

export async function deleteAdvanceRequest(requestId: string) {
    const session = await auth()

    if (!session?.user?.id) {
        throw new Error("Unauthorized")
    }

    // Verify ownership and status
    const request = await prisma.advanceRequest.findUnique({
        where: { id: requestId }
    })

    if (!request) {
        throw new Error("Demande introuvable")
    }

    if (request.userId !== session.user.id) {
        throw new Error("Vous n'êtes pas autorisé à supprimer cette demande")
    }

    if (request.status !== "PENDING") {
        throw new Error("Seules les demandes en attente peuvent être supprimées")
    }

    // Delete the request
    await prisma.advanceRequest.delete({
        where: { id: requestId }
    })

    revalidatePath('/dashboard/salarie')
    revalidatePath('/dashboard/rh/acomptes')
}

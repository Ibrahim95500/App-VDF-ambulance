"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { createNotification, createManyNotifications } from "./notifications.actions"
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

    // Notify the employee in-app
    await createNotification({
        userId: request.userId,
        title: `Demande d'acompte ${status === 'APPROVED' ? 'Approuvée' : 'Refusée'}`,
        message: `Votre demande d'un montant de ${request.amount}€ a été ${status === 'APPROVED' ? 'acceptée' : 'refusée'}.`,
        type: "ADVANCE",
        status,
        link: "/dashboard/salarie"
    })

    revalidatePath('/dashboard/rh/acomptes')
    revalidatePath('/dashboard/salarie')
}

export async function createAdvanceRequest(amount: number, reason: string) {
    console.log(`[ACTION] createAdvanceRequest started - Amount: ${amount}, Reason: ${reason}`);
    const session = await auth()

    if (!session?.user?.id) {
        console.error("[ACTION] Unauthorized access attempt");
        throw new Error("Unauthorized")
    }

    // 15th of the month rule check
    const today = new Date()
    console.log(`[ACTION] Today's date: ${today.getDate()}`);
    if (today.getDate() > 15) {
        console.warn("[ACTION] Request attempted after the 15th");
        throw new Error("Les demandes d'acompte ne sont possibles que du 1er au 15 du mois.")
    }

    // Target Month Calculation (Next Month)
    const targetDate = new Date(today.getFullYear(), today.getMonth() + 1, 1) // First day of next month
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
        throw new Error("Vous avez déjà effectué une demande d'acompte pour ce mois cible.")
    }

    const validatedFields = AdvanceRequestSchema.safeParse({ amount, reason })
    if (!validatedFields.success) {
        console.warn("[ACTION] Schema validation failed:", validatedFields.error.issues[0].message);
        throw new Error(validatedFields.error.issues[0].message)
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

    // 2. Email notification to Admin
    try {
        console.log("[ACTION] Sending email notification...");
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
}

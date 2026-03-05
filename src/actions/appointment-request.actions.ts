"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { RequestStatus } from "@prisma/client"
import {
    createAppointmentRequest,
    updateAppointmentRequestStatus
} from "@/services/appointment-request"
import { createNotification, createManyNotifications } from "./notifications.actions"
import { sendPushNotification } from "./web-push.actions"
import { sendBrandedEmail } from "@/lib/mail"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export async function submitAppointmentRequest(formData: FormData) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            throw new Error("Non autorisé")
        }

        const reason = formData.get("reason") as string
        const description = formData.get("description") as string

        if (!reason) {
            throw new Error("Le motif est obligatoire")
        }

        const request = await createAppointmentRequest({
            userId: session.user.id,
            reason,
            description: description || undefined,
        })

        // Notifications to RH
        const rhUsers = await prisma.user.findMany({ where: { role: 'RH' } })
        const userName = session.user.name || session.user.email || "Utilisateur"

        const notifications: any[] = rhUsers.map(rh => ({
            userId: rh.id,
            title: "Nouvelle demande de rendez-vous",
            message: `${userName} a sollicité un entretien (Motif: ${reason}).`,
            type: "SERVICE", // Reusing SERVICE icon/group for now
            status: "PENDING",
            link: "/dashboard/rh/rendez-vous"
        }));

        notifications.push({
            userId: session.user.id,
            title: "Demande de rendez-vous envoyée",
            message: `Votre demande pour le motif "${reason}" a bien été transmise aux RH.`,
            type: "SERVICE",
            status: "PENDING",
            link: "/dashboard/salarie/rendez-vous"
        });

        await createManyNotifications(notifications)

        for (const rh of rhUsers) {
            await sendPushNotification(
                rh.id,
                "Nouvelle demande de rendez-vous",
                `${userName} a sollicité un entretien (${reason}).`,
                "/dashboard/rh/rendez-vous"
            )
        }

        try {
            await sendBrandedEmail({
                to: "ibrahim.nifa01@gmail.com",
                subject: `[Demande RDV] ${reason} - ${userName}`,
                title: "Nouvelle Demande de Rendez-vous",
                preheader: `Nouvelle demande de ${userName}`,
                content: `
                    <p>Une nouvelle demande de rendez-vous a été déposée sur l'application.</p>
                    <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
                        <p><strong>Collaborateur :</strong> ${userName}</p>
                        <p><strong>Motif :</strong> ${reason}</p>
                        <p><strong>Description :</strong></p>
                        <p style="white-space: pre-wrap; font-style: italic; color: #4b5563;">${description || "-"}</p>
                    </div>
                `,
                actionUrl: `${process.env.NEXTAUTH_URL}/dashboard/rh/rendez-vous`,
                actionText: "Voir la demande"
            });
        } catch (error) {
            console.error("Failed to send email to RH:", error);
        }

        revalidatePath("/dashboard/salarie/rendez-vous")
        revalidatePath("/dashboard/rh/rendez-vous")
        return { success: true }
    } catch (error: any) {
        console.error("Submit AppointmentRequest error:", error)
        return { error: error.message || "Une erreur est survenue" }
    }
}

export async function updateAppointmentStatus(
    id: string,
    status: RequestStatus,
    adminComment?: string,
    appointmentDate?: Date,
    appointmentMode?: string
) {
    try {
        const session = await auth()
        if (!session?.user || (session.user as any).role !== "RH") {
            throw new Error("Non autorisé")
        }

        if (status === 'APPROVED' && (!appointmentDate || !appointmentMode)) {
            throw new Error("La date et le mode de rendez-vous sont obligatoires pour valider la demande.")
        }

        const updatedRequest = await updateAppointmentRequestStatus(
            id,
            status,
            adminComment,
            appointmentDate,
            appointmentMode
        )

        // Notification in-app & Push
        await createNotification({
            userId: updatedRequest.userId,
            title: `Rendez-vous ${status === 'APPROVED' ? 'Confirmé' : 'Refusé'}`,
            message: status === 'APPROVED' ? `Votre rendez-vous (${updatedRequest.reason}) est fixé au ${format(new Date(appointmentDate!), "dd MMM yyyy 'à' HH:mm", { locale: fr })}.` : `Votre demande de rendez-vous a été refusée.`,
            type: "SERVICE",
            status,
            link: "/dashboard/salarie/rendez-vous"
        })

        await sendPushNotification(
            updatedRequest.userId,
            `Rendez-vous ${status === 'APPROVED' ? 'Confirmé' : 'Refusé'}`,
            status === 'APPROVED' ? `Votre rendez-vous (${updatedRequest.reason}) est fixé au ${format(new Date(appointmentDate!), "dd/MM/yyyy HH:mm")}.` : `Votre demande de rendez-vous a été refusée.`,
            "/dashboard/salarie/rendez-vous"
        )

        // Email to employee
        if (updatedRequest.user.email) {
            try {
                const modeText = appointmentMode === 'TELEPHONE' ? 'par téléphone' : 'au bureau';
                const dateText = appointmentDate ? format(new Date(appointmentDate), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr }) : '';

                await sendBrandedEmail({
                    to: updatedRequest.user.email,
                    subject: `Décision : Votre demande de rendez-vous`,
                    title: `Rendez-vous ${status === 'APPROVED' ? 'Confirmé' : 'Refusé'}`,
                    preheader: `Réponse à votre demande de rendez-vous`,
                    content: `
                        <p>Bonjour ${updatedRequest.user.firstName || updatedRequest.user.name || ''},</p>
                        <p>Votre demande de rendez-vous pour le motif "<strong>${updatedRequest.reason}</strong>" a été examinée par le service RH.</p>
                        <p>Le statut de votre demande est désormais : 
                           <strong style="color: ${status === 'APPROVED' ? '#16a34a' : '#dc2626'};">
                             ${status === 'APPROVED' ? 'APPROUVÉE' : 'REFUSÉE'}
                           </strong>.
                        </p>
                        ${status === 'APPROVED' ? `
                        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 0 0 10px 0; color: #166534;"><strong>📅 Détails de l'entretien :</strong></p>
                            <p style="margin: 0; color: #15803d;">Date : <strong>${dateText}</strong></p>
                            <p style="margin: 5px 0 0 0; color: #15803d;">Modalité : <strong>${modeText}</strong></p>
                        </div>
                        ` : ''}
                        ${adminComment ? `
                        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
                            <p style="margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: bold;">Message du Service RH :</p>
                            <p style="margin: 0; font-style: italic; color: #334155;">"${adminComment}"</p>
                        </div>
                        ` : ''}
                        <p>Vous pouvez consulter les détails dans votre espace personnel.</p>
                    `,
                    actionUrl: `${process.env.NEXTAUTH_URL}/dashboard/salarie/rendez-vous`,
                    actionText: "Accéder à mes rendez-vous"
                });
            } catch (error) {
                console.error("Failed to send status update email to employee:", error);
            }
        }

        revalidatePath("/dashboard/rh/rendez-vous")
        revalidatePath("/dashboard/salarie/rendez-vous")
        return { success: true }
    } catch (error: any) {
        console.error("Update AppointmentStatus error:", error)
        return { error: error.message || "Une erreur est survenue" }
    }
}

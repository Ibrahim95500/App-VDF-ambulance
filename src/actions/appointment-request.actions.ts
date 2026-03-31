"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { RequestStatus } from "@prisma/client"
import {
    createAppointmentRequest,
    updateAppointmentRequestStatus,
    requestReschedule,
    replyToReschedule,
    RescheduleEvent
} from "@/services/appointment-request"
import { createNotification, createManyNotifications } from "./notifications.actions"
import { sendPushNotification } from "./web-push.actions"
import { sendBrandedEmail } from "@/lib/mail"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

/** Formate une date en heure locale France (Europe/Paris) pour les messages de notification */
function formatParis(date: Date | string, withTime = true): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleString('fr-FR', {
        timeZone: 'Europe/Paris',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {})
    })
}

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

        // Notifications to RH & ADMIN
        const rhUsers = await prisma.user.findMany({ where: { OR: [{ roles: { has: 'RH' } }, { roles: { has: 'ADMIN' } }] } })
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
            // Fetch sender details for signature
            const sender = await prisma.user.findUnique({ where: { id: session.user.id }, select: { firstName: true, lastName: true, email: true } })
            const senderName = [sender?.firstName, sender?.lastName].filter(Boolean).join(' ') || sender?.email || userName
            await sendBrandedEmail({
                to: "vdf95rh@gmail.com",
                cc: `rezan.selva@gmail.com, ibrahim.nifa01@gmail.com, ${sender?.email || ''}`,
                subject: `[Demande RDV] ${reason} - ${senderName}`,
                title: "Nouvelle Demande de Rendez-vous",
                preheader: `Nouvelle demande de ${senderName}`,
                content: `
                    <p>Une nouvelle demande de rendez-vous a été déposée sur l'application.</p>
                    <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
                        <p><strong>Collaborateur :</strong> ${senderName}</p>
                        <p><strong>Motif :</strong> ${reason}</p>
                        <p><strong>Description :</strong></p>
                        <p style="white-space: pre-wrap; font-style: italic; color: #4b5563;">${description || "-"}</p>
                    </div>
                    <p style="margin-top: 20px;">Cordialement,<br/><strong>${senderName}</strong></p>
                `,
                actionUrl: `${process.env.NEXTAUTH_URL}/dashboard/rh/rendez-vous`,
                actionText: "Gérer la proposition",
                signatureHtml: `
                    <div class="signature-name">${senderName}</div>
                    <div>Collaborateur - VDF Ambulance</div>
                `
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
        if (!session?.user || (!(session.user as any).roles?.includes("RH") && !(session.user as any).roles?.includes("ADMIN"))) {
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
                const dateText = appointmentDate ? formatParis(new Date(appointmentDate)) : '';
                await sendBrandedEmail({
                    to: updatedRequest.user.email,
                    from: '"App Ambulance" <vdf95rh@gmail.com>',
                    replyTo: "vdf95rh@gmail.com",
                    cc: "rezan.selva@gmail.com, ibrahim.nifa01@gmail.com",
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
                    actionText: "Accéder à mes rendez-vous",
                    signatureHtml: `
                        <div class="signature-name">VDF RH & Hamid Cheikh</div>
                        <div>Direction - VDF Ambulance</div>
                    `
                });
            } catch (error) {
                console.error("Failed to send status update email to employee:", error);
            }
        }

        // Bot Telegram Push Notification
        if (updatedRequest.user.telegramChatId) {
            try {
                const { sendTelegramMessage } = await import("@/lib/telegram/telegram-api");
                const decisionStr = status === 'APPROVED' ? "✅ <b>APPROUVÉE</b>" : "❌ <b>REFUSÉE</b>";
                
                let msg = `📅 <b>Mise à jour relative à votre RDV Direction</b>\n\n`;
                msg += `Motif : <b>${updatedRequest.reason}</b>\n`;
                msg += `Décision : ${decisionStr}\n`;
                
                if (status === 'APPROVED' && appointmentDate) {
                    msg += `Date : <b>${formatParis(new Date(appointmentDate))}</b>\n`;
                    msg += `Mode : ${appointmentMode === 'TELEPHONE' ? 'Par Téléphone' : 'Au Bureau'}\n`;
                }
                
                if (adminComment) msg += `Message de la RH : <i>${adminComment}</i>\n`;
                
                await sendTelegramMessage(updatedRequest.user.telegramChatId, msg);
            } catch (botErr) {
                console.error("Erreur Telegram Notify Appointment:", botErr);
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

export async function createConvocationAction(
    userId: string,
    reason: string,
    appointmentDate: Date,
    appointmentMode: string,
    adminComment: string
) {
    try {
        const session = await auth()
        if (!session?.user || (!(session.user as any).roles?.includes("RH") && !(session.user as any).roles?.includes("ADMIN"))) {
            throw new Error("Non autorisé")
        }

        const request = await createAppointmentRequest({
            userId,
            reason,
            type: 'CONVOCATION',
            initiator: 'RH',
            status: 'APPROVED', // A convocation is directly set as approved/scheduled
            appointmentDate,
            appointmentMode,
            adminComment: adminComment || undefined
        })

        // Notifications
        await createNotification({
            userId,
            title: "Nouvelle Convocation",
            message: `Vous êtes convoqué(e) par la Direction RH (${reason}) le ${formatParis(new Date(appointmentDate))}.`,
            type: "SERVICE",
            status: "APPROVED",
            link: "/dashboard/salarie/rendez-vous"
        })

        await sendPushNotification(
            userId,
            "Nouvelle Convocation",
            `Vous êtes convoqué(e) par la Direction RH (${reason}) le ${formatParis(new Date(appointmentDate), false)}.`,
            "/dashboard/salarie/rendez-vous"
        )

        // Envoyer le mail au salarié convoqué
        try {
            const employee = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, firstName: true, lastName: true } })
            if (employee?.email) {
                const employeeName = [employee.firstName, employee.lastName].filter(Boolean).join(' ') || employee.email
                const modeLabel = appointmentMode === 'TELEPHONE' ? 'Par Téléphone' : 'Au Bureau'
                await sendBrandedEmail({
                    to: employee.email,
                    from: '"App Ambulance" <vdf95rh@gmail.com>',
                    replyTo: "vdf95rh@gmail.com",
                    cc: "rezan.selva@gmail.com, ibrahim.nifa01@gmail.com",
                    subject: `[Convocation] ${reason} - ${formatParis(new Date(appointmentDate))}`,
                    title: "Convocation RH",
                    preheader: `Vous êtes convoqué(e) le ${formatParis(new Date(appointmentDate), false)}`,
                    content: `
                        <p>Bonjour <strong>${employeeName}</strong>,</p>
                        <p>Vous êtes convoqué(e) par la Direction des Ressources Humaines.</p>
                        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; border: 1px solid #bfdbfe; margin: 20px 0;">
                            <p><strong>Motif :</strong> ${reason}</p>
                            <p><strong>Date et Heure :</strong> ${formatParis(new Date(appointmentDate))}</p>
                            <p><strong>Modalité :</strong> ${modeLabel}</p>
                            ${adminComment ? `<p><strong>Message de la RH :</strong> <em>${adminComment}</em></p>` : ''}
                        </div>
                        <p style="font-size: 13px; color: #6b7280;">Veuillez vous préparer en conséquence et vous connecter à l'application pour plus de détails.</p>
                    `,
                    actionUrl: `${process.env.NEXTAUTH_URL}/dashboard/salarie/rendez-vous`,
                    actionText: "Voir mes convocations",
                    signatureHtml: `
                        <div class="signature-name">VDF RH & Hamid Cheikh</div>
                        <div>Direction - VDF Ambulance</div>
                    `
                });
            }
        } catch (emailError) {
            console.error("Failed to send convocation email to employee:", emailError)
        }

        revalidatePath("/dashboard/rh/rendez-vous")
        revalidatePath("/dashboard/salarie/rendez-vous")
        return { success: true }
    } catch (error: any) {
        console.error("Create Convocation error:", error)
        return { error: error.message || "Une erreur est survenue" }
    }
}

export async function submitRescheduleRequest(
    id: string,
    proposedDate: Date,
    message: string
) {
    try {
        const session = await auth()
        if (!session?.user?.id) throw new Error("Non autorisé")

        const event: RescheduleEvent = {
            date: new Date().toISOString(),
            actor: 'SALARIE',
            action: 'PROPOSE',
            proposedDate: proposedDate.toISOString(),
            message
        }

        await requestReschedule(id, proposedDate, message, event)

        const rhUsers = await prisma.user.findMany({ where: { OR: [{ roles: { has: 'RH' } }, { roles: { has: 'ADMIN' } }] } })
        const userName = session.user.name || session.user.email || "Utilisateur"

        const notifications: any[] = rhUsers.map(rh => ({
            userId: rh.id,
            title: "Demande de report",
            message: `${userName} souhaite reporter son rendez-vous au ${formatParis(proposedDate)}.`,
            type: "SERVICE",
            status: "PENDING",
            link: "/dashboard/rh/rendez-vous"
        }))

        await createManyNotifications(notifications)

        for (const rh of rhUsers) {
            await sendPushNotification(
                rh.id,
                "Demande de report de rendez-vous",
                `${userName} propose une nouvelle date.`,
                "/dashboard/rh/rendez-vous"
            )
        }

        // Mail à la RH pour signaler la demande de report
        try {
            const senderUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { firstName: true, lastName: true, email: true } })
            const senderFullName = [senderUser?.firstName, senderUser?.lastName].filter(Boolean).join(' ') || userName
            await sendBrandedEmail({
                to: "vdf95rh@gmail.com",
                cc: `rezan.selva@gmail.com, ibrahim.nifa01@gmail.com, ${senderUser?.email || ''}`,
                subject: `[Report RDV] ${senderFullName} propose une nouvelle date`,
                title: "Demande de Report de Rendez-vous",
                preheader: `${senderFullName} souhaite reporter son rendez-vous`,
                content: `
                    <p>Un(e) collaborateur/trice souhaite reporter son rendez-vous.</p>
                    <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
                        <p><strong>Collaborateur :</strong> ${senderFullName}</p>
                        <p><strong>Nouvelle date proposée :</strong> ${formatParis(proposedDate)}</p>
                        ${message ? `<p><strong>Message :</strong> <em>${message}</em></p>` : ''}
                    </div>
                    <p style="margin-top: 20px;">Cordialement,<br/><strong>${senderFullName}</strong></p>
                `,
                actionUrl: `${process.env.NEXTAUTH_URL}/dashboard/rh/rendez-vous`,
                actionText: "Voir la demande de rendez-vous",
                signatureHtml: `
                    <div class="signature-name">${senderFullName}</div>
                    <div>Collaborateur - VDF Ambulance</div>
                `
            });
        } catch (emailError) {
            console.error("Failed to send reschedule request email to RH:", emailError)
        }

        revalidatePath("/dashboard/rh/rendez-vous")
        revalidatePath("/dashboard/salarie/rendez-vous")
        return { success: true }
    } catch (error: any) {
        console.error("Submit Reschedule Request error:", error)
        return { error: error.message || "Une erreur est survenue" }
    }
}

export async function submitRescheduleReply(
    id: string,
    action: 'ACCEPT' | 'REJECT',
    message: string,
    newAppointmentDate?: Date
) {
    try {
        const session = await auth()
        if (!session?.user || (!(session.user as any).roles?.includes("RH") && !(session.user as any).roles?.includes("ADMIN"))) {
            throw new Error("Non autorisé")
        }

        const event: RescheduleEvent = {
            date: new Date().toISOString(),
            actor: 'RH',
            action,
            message
        }

        const updatedRequest = await replyToReschedule(id, action, event, newAppointmentDate)

        await createNotification({
            userId: updatedRequest.userId,
            title: `Report de rendez-vous ${action === 'ACCEPT' ? 'Accepté' : 'Refusé'}`,
            message: action === 'ACCEPT' ? `Votre nouvelle date a été validée.` : `Votre demande de report a été refusée, la date initiale est maintenue.`,
            type: "SERVICE",
            status: action === 'ACCEPT' ? 'APPROVED' : 'REJECTED',
            link: "/dashboard/salarie/rendez-vous"
        })

        await sendPushNotification(
            updatedRequest.userId,
            `Report de rendez-vous ${action === 'ACCEPT' ? 'Accepté' : 'Refusé'}`,
            action === 'ACCEPT' ? `Votre nouvelle date a été validée.` : `Votre demande de report a été refusée, la date initiale est maintenue.`,
            "/dashboard/salarie/rendez-vous"
        )

        // Mail au salarié pour le résultat de sa demande de report
        try {
            const employee = await prisma.user.findUnique({ where: { id: updatedRequest.userId }, select: { email: true, firstName: true, lastName: true } })
            if (employee?.email) {
                const employeeName = [employee.firstName, employee.lastName].filter(Boolean).join(' ') || employee.email
                const accepted = action === 'ACCEPT'
                await sendBrandedEmail({
                    to: employee.email,
                    from: '"App Ambulance" <vdf95rh@gmail.com>',
                    replyTo: "vdf95rh@gmail.com",
                    cc: "rezan.selva@gmail.com, ibrahim.nifa01@gmail.com",
                    subject: `[Report RDV] ${accepted ? 'Accepté' : 'Refusé'} - ${employeeName}`,
                    title: accepted ? "Report Accepté ✅" : "Report Refusé ❌",
                    preheader: accepted ? "Votre nouvelle date a été validée" : "Votre demande de report a été refusée",
                    content: `
                        <p>Bonjour <strong>${employeeName}</strong>,</p>
                        ${accepted
                            ? `<p>La date de votre rendez-vous a été <strong style="color:#16a34a;">mise à jour</strong>.</p>
                               <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; border: 1px solid #bbf7d0; margin: 20px 0;">
                                   <p><strong>Nouvelle date validée :</strong> ${newAppointmentDate ? format(new Date(newAppointmentDate), "dd MMMM yyyy 'à' HH:mm", { locale: fr }) : 'Voir dans l\'application'}</p>
                                   ${message ? `<p><strong>Message de la RH :</strong> <em>${message}</em></p>` : ''}
                               </div>`
                            : `<p>La demande de modification de rendez-vous a été <strong style="color:#dc2626;">refusée</strong>. La date fixée précédemment est maintenue.</p>
                               <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; border: 1px solid #fecaca; margin: 20px 0;">
                                   ${message ? `<p><strong>Justification de la RH :</strong> <em>${message}</em></p>` : ''}
                               </div>`
                        }
                        <p style="font-size: 13px; color: #6b7280;">Connectez-vous à l'application pour consulter les détails de votre rendez-vous.</p>
                    `,
                    actionUrl: `${process.env.NEXTAUTH_URL}/dashboard/salarie/rendez-vous`,
                    actionText: "Voir mes rendez-vous",
                    signatureHtml: `
                        <div class="signature-name">VDF RH & Hamid Cheikh</div>
                        <div>Direction - VDF Ambulance</div>
                    `
                });
            }
        } catch (emailError) {
            console.error("Failed to send reschedule reply email to employee:", emailError)
        }

        revalidatePath("/dashboard/rh/rendez-vous")
        revalidatePath("/dashboard/salarie/rendez-vous")
        return { success: true }
    } catch (error: any) {
        console.error("Submit Reschedule Reply error:", error)
        return { error: error.message || "Une erreur est survenue" }
    }
}

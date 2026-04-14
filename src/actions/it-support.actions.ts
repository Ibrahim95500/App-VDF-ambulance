"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendBrandedEmail } from "@/lib/mail";
import { sendPushNotification } from "@/actions/web-push.actions";
import { createNotification } from "@/actions/notifications.actions";

export async function updateTicketStatus(ticketId: string, status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED", adminComment?: string) {
    try {
        const ticket = await prisma.supportTicket.update({
            where: { id: ticketId },
            data: { 
                status,
                ...(adminComment !== undefined && { adminComment })
            },
            include: { user: true }
        });
        
        // Si le ticket passe en RESOLU ou CLOS, on alerte le salarié !
        if (status === "RESOLVED" || status === "CLOSED") {
            const emailContent = `
                <div style="font-family: Arial, sans-serif;">
                    <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin-bottom: 20px;">
                        <h2 style="color: #166534; margin: 0 0 10px 0;">Bonne nouvelle ! 🎉</h2>
                        <p style="margin: 0; color: #15803d;">Votre incident technique a été résolu par notre équipe IT.</p>
                    </div>
                    
                    <p><strong>Incident d'origine :</strong> <span style="color:#2563eb;">${ticket.subject}</span></p>
                    
                    ${ticket.adminComment ? `
                        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                        <h3 style="color:#111827;">Note de Résolution (IT) :</h3>
                        <div style="background-color:#eff6ff; padding:15px; border-radius:8px; white-space:pre-wrap; color:#1e3a8a; border: 1px solid #bfdbfe;">${ticket.adminComment}</div>
                    ` : ''}
                    
                    <p style="margin-top:20px; color:#6b7280; font-size:13px;">Vous pouvez consulter tout votre historique de demandes d'assistance en cliquant sur la Bouée de sauvetage 🛟 depuis l'application.</p>
                </div>
            `;

            if (ticket.user.email) {
                // On essaie d'envoyer, mais on ne throw pas d'erreur si l'envoi rate pour ne pas casser l'UI IT
                try {
                    await sendBrandedEmail({
                        to: ticket.user.email,
                        subject: `[Résolu] Incident : ${ticket.subject.substring(0, 30)}...`,
                        title: "Support IT - Billet Résolu",
                        preheader: "Réponse de notre équipe technique concernant votre demande.",
                        content: emailContent,
                        actionUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://vdf-ambulance.fr',
                        actionText: "Retourner sur l'Application"
                    });
                } catch (e) {
                    console.error("IT Action Mail Error (Silent):", e);
                }
            }
        }

        // Envoi de Notification PUSH native peu importe le statut !
        const pushTitle = `Ticket IT #${ticket.id.slice(-6).toUpperCase()} : ${status === 'IN_PROGRESS' ? 'Pris en charge' : status === 'RESOLVED' ? 'Résolu !' : status === 'CLOSED' ? 'Fermé' : 'Mis à jour'}`;
        const pushMessage = `Le statut de votre demande technique "${ticket.subject.substring(0, 20)}..." a évolué.`;
        
        try {
            await sendPushNotification(ticket.userId, pushTitle, pushMessage, "/dashboard/it");
            
            // Notification Interne (Cloche)
            await createNotification({
                userId: ticket.userId,
                title: pushTitle,
                message: pushMessage,
                type: "IT_SUPPORT",
                status: status,
                link: undefined // Pas de lien direct car c'est géré via la modale globale pour l'instant
            });
        } catch (e) {
            console.error("IT Action Push Notification Error (Silent):", e);
        }

        revalidatePath('/dashboard/it');
        return { success: true };
    } catch (e) {
        console.error("IT Action Error:", e);
        return { error: "Erreur lors de la mise à jour." };
    }
}

export async function salarieUpdateTicketStatus(ticketId: string, status: "CLOSED" | "IN_PROGRESS", userComment?: string) {
    try {
        const ticket = await prisma.supportTicket.update({
            where: { id: ticketId },
            data: { status },
            include: { user: true }
        });
        
        // Notifier le service IT par email (en silencieux pour ne pas bloquer l'UI)
        const roleStr = ticket.user.role || "SALARIE";
        const emailContent = `
            <div style="font-family: Arial, sans-serif;">
                <div style="background-color: ${status === 'CLOSED' ? '#f0fdf4' : '#fef2f2'}; border-left: 4px solid ${status === 'CLOSED' ? '#22c55e' : '#ef4444'}; padding: 15px; margin-bottom: 20px;">
                    <h2 style="color: ${status === 'CLOSED' ? '#166534' : '#991b1b'}; margin: 0 0 10px 0;">Retour du Demandeur</h2>
                    <p style="margin:0 0 5px 0;"><strong>👤 Demandeur :</strong> ${ticket.user.firstName} ${ticket.user.lastName} (${roleStr})</p>
                    <p style="margin: 0;"><strong>Nouvel État :</strong> ${status === 'CLOSED' ? 'RÉSOLU / CLOS (Le problème est bien réglé ✅)' : 'EN COURS / RELANCÉ (Le problème persiste ❌)'}</p>
                </div>
                
                <p><strong>Incident d'origine :</strong> <span style="color:#2563eb;">${ticket.subject}</span></p>
                
                ${userComment ? `
                    <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                    <h3 style="color:#111827;">Commentaire du Demandeur :</h3>
                    <div style="background-color:#fffbeb; padding:15px; border-radius:8px; white-space:pre-wrap; color:#92400e; border: 1px solid #fde68a;">${userComment}</div>
                ` : ''}
                
                <p style="margin-top:20px; color:#6b7280; font-size:13px;">Consultez les détails depuis le dashboard IT.</p>
            </div>
        `;

        try {
            await sendBrandedEmail({
                to: "digitagency.nifa@gmail.com",
                replyTo: ticket.user.email || undefined,
                subject: `[RETOUR DEMANDEUR] Incident : ${ticket.subject.substring(0, 30)}...`,
                title: "Retour sur Incident Informatique",
                preheader: status === 'CLOSED' ? "L'utilisateur a fermé le ticket." : "L'utilisateur indique que le problème persiste.",
                content: emailContent,
                actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://vdf-ambulance.fr'}/dashboard/it`,
                actionText: "Ouvrir le Tableau de Bord IT"
            });
        } catch (e) {
            console.error("Action Mail Error (Silent):", e);
        }

        revalidatePath('/dashboard/it');
        return { success: true };
    } catch (e) {
        console.error("Action Error:", e);
        return { error: "Erreur lors de la mise à jour." };
    }
}

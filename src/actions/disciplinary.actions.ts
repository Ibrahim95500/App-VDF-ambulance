"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { createAppointmentRequest } from "@/services/appointment-request"
import { createNotification } from "./notifications.actions"
import { sendPushNotification } from "./web-push.actions"
import { sendBrandedEmail } from "@/lib/mail"

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

/**
 * Convoquer un salarié suite à 3 oublis.
 * Crée un rendez-vous approuvé et remet le compteur à zéro.
 */
export async function summonForThreeStrikes(
    userId: string,
    appointmentDate: Date,
    appointmentMode: string,
    adminComment: string
) {
    try {
        const session = await auth()
        if (!session?.user || (!(session.user as any).roles?.includes("RH") && !(session.user as any).roles?.includes("ADMIN"))) {
            throw new Error("Non autorisé")
        }

        const reason = "Convocation Disciplinaire : 3 Oublis Atteints"

        // 1. Créer le rendez-vous (déjà validé car initié par RH)
        const request = await createAppointmentRequest({
            userId,
            reason,
            type: 'CONVOCATION',
            initiator: 'RH',
            status: 'APPROVED',
            appointmentDate,
            appointmentMode,
            adminComment: adminComment || undefined
        })

        // 2. Remettre le compteur à zéro
        await prisma.user.update({
            where: { id: userId },
            data: { oubliCount: 0 }
        })

        // 3. Notifications in-app & Push
        await createNotification({
            userId,
            title: "Convocation Officielle : 3 Oublis",
            message: `Suite à 3 oublis, vous êtes convoqué(e) le ${formatParis(new Date(appointmentDate))}.`,
            type: "SERVICE",
            status: "APPROVED",
            link: "/dashboard/salarie/rendez-vous"
        })

        await sendPushNotification(
            userId,
            "Convocation Disciplinaire",
            `Entretien RH fixé le ${formatParis(new Date(appointmentDate), false)}.`,
            "/dashboard/salarie/rendez-vous"
        )

        // 4. Email au salarié
        const employee = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, firstName: true, lastName: true } })
        if (employee?.email) {
            const employeeName = [employee.firstName, employee.lastName].filter(Boolean).join(' ') || employee.email
            const modeLabel = appointmentMode === 'TELEPHONE' ? 'Par Téléphone' : 'Au Bureau'
            
            await sendBrandedEmail({
                to: employee.email,
                from: '"Direction RH VDF" <vdf95rh@gmail.com>',
                cc: "rezan.selva@gmail.com, ibrahim.nifa01@gmail.com",
                subject: `[CONVOCATION] 3ème Oubli atteint - Entretien le ${formatParis(new Date(appointmentDate), false)}`,
                title: "Convocation Disciplinaire",
                preheader: `Convocation officielle suite à 3 oublis de validation.`,
                content: `
                    <p>Bonjour <strong>${employeeName}</strong>,</p>
                    <p>Comme suite à vos 3 oublis de validation de planification, nous vous informons que vous êtes convoqué(e) formellement à un entretien.</p>
                    <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; border: 1px solid #fca5a5; margin: 20px 0;">
                        <p style="margin: 0 0 10px 0; color: #b91c1c;"><strong>📅 Détails de la convocation :</strong></p>
                        <p style="margin: 0; color: #991b1b;">Date : <strong>${formatParis(new Date(appointmentDate))}</strong></p>
                        <p style="margin: 5px 0 0 0; color: #991b1b;">Modalité : <strong>${modeLabel}</strong></p>
                        ${adminComment ? `<p style="margin: 10px 0 0 0; font-size: 13px; font-style: italic;">"${adminComment}"</p>` : ''}
                    </div>
                    <p>La remise à zéro de votre compteur d'oublis a été effectuée. Nous comptons sur votre professionnalisme pour la suite.</p>
                `,
                actionUrl: `${process.env.NEXTAUTH_URL}/dashboard/salarie/rendez-vous`,
                actionText: "Voir ma convocation",
                signatureHtml: `
                    <div class="signature-name">La Direction RH</div>
                    <div>VDF Ambulance</div>
                `
            })
        }

        revalidatePath("/dashboard/rh/collaborateurs")
        revalidatePath("/dashboard/rh/rendez-vous")
        return { success: true }
    } catch (error: any) {
        console.error("Summon for three strikes error:", error)
        return { error: error.message || "Une erreur est survenue" }
    }
}

/**
 * Accorder une clémence à un salarié suite à 3 oublis.
 * Envoie un rappel à l'ordre et remet le compteur à zéro sans rendez-vous.
 */
export async function pardonForThreeStrikes(userId: string, adminMessage: string) {
    try {
        const session = await auth()
        if (!session?.user || (!(session.user as any).roles?.includes("RH") && !(session.user as any).roles?.includes("ADMIN"))) {
            throw new Error("Non autorisé")
        }

        // 1. Remettre le compteur à zéro
        await prisma.user.update({
            where: { id: userId },
            data: { oubliCount: 0 }
        })

        // 2. Notification in-app
        await createNotification({
            userId,
            title: "Rappel à l'Ordre (3 oublis)",
            message: `La Direction a pris connaissance de vos oublis. Un message vous a été adressé par mail. Fais attention pour la suite.`,
            type: "SERVICE",
            status: "APPROVED",
            link: "/dashboard/salarie/regulation"
        })

        // 3. Email au salarié (Le message de clémence)
        const employee = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, firstName: true, lastName: true } })
        if (employee?.email) {
            const employeeName = [employee.firstName, employee.lastName].filter(Boolean).join(' ') || employee.email
            
            await sendBrandedEmail({
                to: employee.email,
                from: '"Direction RH VDF" <vdf95rh@gmail.com>',
                cc: "rezan.selva@gmail.com, ibrahim.nifa01@gmail.com",
                subject: `[MESSAGE RH] Rappel concernant vos 3 oublis`,
                title: "Rappel à l'Ordre",
                preheader: `Message de la Direction suite à vos oublis.`,
                content: `
                    <p>Bonjour <strong>${employeeName}</strong>,</p>
                    <p>Nous avons constaté que vous avez atteint le seuil de <strong>3 oublis</strong> de validation de mission.</p>
                    <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; border: 1px solid #fcd34d; margin: 20px 0;">
                        <p style="color: #92400e; font-weight: bold;">Note de la Direction :</p>
                        <p style="font-style: italic; color: #b45309;">"${adminMessage || "Je te laisse tranquille pour cette fois mais j'ai vu que tu as oublié 3 fois, fais attention pour la suite."}"</p>
                    </div>
                    <p>Votre compteur a été remis à zéro exceptionnellement. Nous vous demandons d'être plus vigilant sur vos prochaines missions.</p>
                `,
                signatureHtml: `
                    <div class="signature-name">La Direction RH</div>
                    <div>VDF Ambulance</div>
                `
            })
        }

        revalidatePath("/dashboard/rh/collaborateurs")
        return { success: true }
    } catch (error: any) {
        console.error("Pardon for three strikes error:", error)
        return { error: error.message || "Une erreur est survenue" }
    }
}

"use server"

import { prisma } from "@/lib/prisma"
import { sendBrandedEmail } from "@/lib/mail"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

/**
 * Appelée à 19h par le gros bouton "Figer et Envoyer"
 * Récupère les assignations de la date (YYYY-MM-DD)
 * Envoie un email individuel détaillé au Leader et au Teammate 
 * en rappelant l'obligation de valider avant 21h sur l'app.
 */
export async function sendPlanningsToEmployees(dateStr: string) {
    try {
        const startOfDay = new Date(`${dateStr}T00:00:00.000Z`)
        const endOfDay = new Date(`${dateStr}T23:59:59.999Z`)

        // On récupère les assignations pour CE jour exact
        const assignments = await prisma.planningAssignment.findMany({
            where: {
                date: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            include: {
                vehicle: true,
                leader: true,
                teammate: true
            }
        })

        if (assignments.length === 0) {
            return { success: false, error: "Aucune assignation trouvée pour cette date." }
        }

        const dateFormatted = format(startOfDay, "EEEE d MMMM yyyy", { locale: fr })
        const dateDisplay = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1)
        
        let emailsSent = 0;

        // 1. Envoyer les emails individuels
        for (const assignment of assignments) {
            const { vehicle, leader, teammate, startTime, endTime } = assignment

            const leaderName = `${leader.firstName || ''} ${leader.lastName || ''}`.trim() || leader.name || leader.email
            const teammateName = `${teammate.firstName || ''} ${teammate.lastName || ''}`.trim() || teammate.name || teammate.email

            const timeRange = `${startTime || '07:00'} - ${endTime || '19:00'}`

            // ------------- Email au Responsable -------------
            if (leader?.email) {
                await sendBrandedEmail({
                    to: leader.email,
                    from: '"VDF Régulation" <vdf95rh@gmail.com>',
                    subject: `[VDF] Votre Planning du ${dateDisplay}`,
                    bcc: 'rezan.selva@gmail.com',
                    title: `Mission du ${dateDisplay}`,
                    preheader: `Votre assignation sur le véhicule ${vehicle.plateNumber}`,
                    content: `
                        <p>Bonjour <strong>${leaderName}</strong>,</p>
                        <p>La Direction a figé votre planning pour le <strong>${dateDisplay}</strong> :</p>
                        
                        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
                            <p>🚑 <strong>Véhicule :</strong> <span style="font-weight: bold; color: #2c3e8a;">${vehicle.plateNumber} (${vehicle.category})</span></p>
                            <p>⏱️ <strong>Horaires :</strong> <strong>${timeRange}</strong></p>
                            <p>👥 <strong>Votre rôle :</strong> Responsable (Chef de bord)</p>
                            <p>🤝 <strong>Votre Co-équipier :</strong> ${teammateName}</p>
                        </div>
                        
                        <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; border: 1px solid #fca5a5; margin-top: 25px;">
                            <p style="margin: 0; color: #b91c1c; font-weight: bold; text-align: center;">🚨 ACTION REQUISE AVANT 21H00 🚨</p>
                            <p style="margin-top: 10px; font-size: 14px; text-align: center;">Vous devez obligatoirement valider votre prise de poste sur l'application avant ce soir 21h00. Passé ce délai, un <strong>Oubli</strong> sera enregistré sur votre dossier RH.</p>
                        </div>
                    `,
                    actionUrl: `${process.env.NEXTAUTH_URL}/dashboard/salarie`,
                    actionText: "Vérifier l'application pour valider",
                    signatureHtml: `
                        <div class="signature-name">Service Régulation</div>
                        <div>VDF Ambulance</div>
                    `
                }).catch(console.error)
                emailsSent++;
            }

            // ------------- Email au Co-équipier -------------
            if (teammate?.email) {
                await sendBrandedEmail({
                    to: teammate.email,
                    from: '"VDF Régulation" <vdf95rh@gmail.com>',
                    subject: `[VDF] Votre Planning du ${dateDisplay}`,
                    bcc: 'rezan.selva@gmail.com',
                    title: `Mission du ${dateDisplay}`,
                    preheader: `Votre assignation sur le véhicule ${vehicle.plateNumber}`,
                    content: `
                        <p>Bonjour <strong>${teammateName}</strong>,</p>
                        <p>La Direction a figé votre planning pour le <strong>${dateDisplay}</strong> :</p>
                        
                        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
                            <p>🚑 <strong>Véhicule :</strong> <span style="font-weight: bold; color: #2c3e8a;">${vehicle.plateNumber} (${vehicle.category})</span></p>
                            <p>⏱️ <strong>Horaires :</strong> <strong>${timeRange}</strong></p>
                            <p>👥 <strong>Votre rôle :</strong> Co-équipier</p>
                            <p>🤝 <strong>Votre Responsable :</strong> ${leaderName}</p>
                        </div>
                        
                        <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; border: 1px solid #fca5a5; margin-top: 25px;">
                            <p style="margin: 0; color: #b91c1c; font-weight: bold; text-align: center;">🚨 ACTION REQUISE AVANT 21H00 🚨</p>
                            <p style="margin-top: 10px; font-size: 14px; text-align: center;">Vous devez obligatoirement valider votre prise de poste sur l'application avant ce soir 21h00. Passé ce délai, un <strong>Oubli</strong> sera enregistré sur votre dossier RH.</p>
                        </div>
                    `,
                    actionUrl: `${process.env.NEXTAUTH_URL}/dashboard/salarie`,
                    actionText: "Vérifier l'application pour valider",
                    signatureHtml: `
                        <div class="signature-name">Service Régulation</div>
                        <div>VDF Ambulance</div>
                    `
                }).catch(console.error)
                emailsSent++;
            }
        }

        return { success: true, message: `Equipages figés ! ${emailsSent} emails ont été envoyés.` }
    } catch (error: any) {
        console.error("Error sendPlanningsToEmployees:", error)
        return { success: false, error: "Erreur lors de l'envoi des plannings." }
    }
}

/**
 * Fonction de vérification typiquement appelée à 21h par CRON (ou manuel).
 * Vérifie toutes les assignations non-validées du jour et pénalise les équipages.
 */
export async function checkConfirmationsAndPenalize(dateStr: string) {
    try {
        const startOfDay = new Date(`${dateStr}T00:00:00.000Z`)
        const endOfDay = new Date(`${dateStr}T23:59:59.999Z`)

        // On cherche toutes les assignations du jour
        const assignments = await prisma.planningAssignment.findMany({
            where: {
                date: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            include: {
                vehicle: true,
                leader: true,
                teammate: true
            }
        })

        if (assignments.length === 0) {
            return { success: true, message: "Aucun équipage prévu pour aujourd'hui." }
        }

        const pendingAssignments = assignments.filter(a => a.status === 'PENDING');
        const validatedAssignments = assignments.filter(a => a.status === 'VALIDATED');
        const rejectedAssignments = assignments.filter(a => a.status === 'REJECTED');

        let penalitiesCount = 0;

        for (const assignment of pendingAssignments) {
            // On punit l'équipage entier car le statut est collectif
            if (assignment.leader) {
                await penalizeUser(assignment.leader.id);
                penalitiesCount++;
            }
            if (assignment.teammate) {
                await penalizeUser(assignment.teammate.id);
                penalitiesCount++;
            }
        }

        // --- ENVOI DU RAPPORT ADMIN ---
        const dateFormatted = format(startOfDay, "EEEE d MMMM yyyy", { locale: fr })
        const dateDisplay = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1)

        let htmlReport = `
            <h2>Rapport de Validation des Équipages</h2>
            <p><strong>Date de la mission :</strong> ${dateDisplay}</p>
            <p><strong>Bilan à 21h00 :</strong> ${validatedAssignments.length} validé(s), ${pendingAssignments.length} oubli(s), ${rejectedAssignments.length} refusé(s).</p>
        `;

        // 1. Les Oublis (en rouge)
        if (pendingAssignments.length > 0) {
            htmlReport += `
                <h3 style="color: #b91c1c; margin-top: 20px;">🚨 Oublis (Pénalités appliquées)</h3>
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    <thead>
                        <tr style="background-color: #fef2f2; border-bottom: 2px solid #fca5a5;">
                            <th style="padding: 10px; text-align: left;">Véhicule</th>
                            <th style="padding: 10px; text-align: left;">Responsable</th>
                            <th style="padding: 10px; text-align: left;">Co-équipier</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            pendingAssignments.forEach(a => {
                const leaderName = `${a.leader?.lastName || ''} ${a.leader?.firstName || ''}`;
                const teammateName = `${a.teammate?.lastName || ''} ${a.teammate?.firstName || ''}`;
                htmlReport += `
                    <tr style="border-bottom: 1px solid #fee2e2;">
                        <td style="padding: 10px; font-weight: bold;">${a.vehicle.plateNumber}</td>
                        <td style="padding: 10px;">${leaderName}</td>
                        <td style="padding: 10px;">${teammateName}</td>
                    </tr>
                `;
            });
            htmlReport += `</tbody></table>`;
        } else {
             htmlReport += `<p style="color: #15803d; font-weight: bold;">Parfait, aucun oubli ce soir !</p>`;
        }

        // 2. Les Validés (en vert)
        if (validatedAssignments.length > 0) {
            htmlReport += `
                <h3 style="color: #15803d; margin-top: 30px;">✅ Équipages Validés</h3>
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    <thead>
                        <tr style="background-color: #f0fdf4; border-bottom: 2px solid #86efac;">
                            <th style="padding: 10px; text-align: left;">Véhicule</th>
                            <th style="padding: 10px; text-align: left;">Responsable</th>
                            <th style="padding: 10px; text-align: left;">Co-équipier</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            validatedAssignments.forEach(a => {
                const leaderName = `${a.leader?.lastName || ''} ${a.leader?.firstName || ''}`;
                const teammateName = `${a.teammate?.lastName || ''} ${a.teammate?.firstName || ''}`;
                htmlReport += `
                    <tr style="border-bottom: 1px solid #dcfce7;">
                        <td style="padding: 10px; font-weight: bold;">${a.vehicle.plateNumber}</td>
                        <td style="padding: 10px;">${leaderName}</td>
                        <td style="padding: 10px;">${teammateName}</td>
                    </tr>
                `;
            });
            htmlReport += `</tbody></table>`;
        }

        // Récupérer les admins pour envoyer le mail
        const admins = await prisma.user.findMany({
            where: { roles: { has: 'ADMIN' } },
            select: { email: true }
        });

        for (const admin of admins) {
            if (admin.email) {
                await sendBrandedEmail({
                    to: admin.email,
                    from: '"VDF Robot" <vdf95rh@gmail.com>',
                    subject: `[Rapport Régulation] Bilan de 21h00 - ${dateDisplay}`,
                    title: `Rapport Régulation 21h00`,
                    preheader: `Bilan de validation des équipages pour le ${dateDisplay}`,
                    content: htmlReport,
                    signatureHtml: `<div class="signature-name">Le Système de Régulation Automatique</div>`
                }).catch(console.error);
            }
        }

        return { success: true, message: `Vérification terminée. ${penalitiesCount} pénalités. Rapport envoyé aux admins.` }
    } catch (error: any) {
        console.error("Error checkConfirmationsAndPenalize:", error)
        return { success: false, error: "Erreur lors de la vérification des confirmations." }
    }
}

async function penalizeUser(userId: string) {
    const user = await prisma.user.update({
        where: { id: userId },
        data: { oubliCount: { increment: 1 } }
    });

    // 3 Strikes = Convocation Discipline
    if (user.oubliCount >= 3) {
        await handleThreeStrikes(user);
    }
}

async function handleThreeStrikes(user: any) {
    // 1. Remise à Zéro
    await prisma.user.update({
        where: { id: user.id },
        data: { oubliCount: 0 }
    });

    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || user.email;

    // 2. Email à l'employé
    if (user.email) {
        await sendBrandedEmail({
            to: user.email,
            from: '"Direction RH VDF" <vdf95rh@gmail.com>',
            bcc: 'rezan.selva@gmail.com',
            subject: `[Avertissement] Convocation RH Requise`,
            title: `Convocation Disciplinaire`,
            preheader: `Avertissement suite à de multiples oublis`,
            content: `
                <p>Bonjour <strong>${fullName}</strong>,</p>
                <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; border: 1px solid #fca5a5; margin: 20px 0;">
                    <p style="color: #b91c1c; font-weight: bold; font-size: 16px;">🛑 3 Oublis Atteints</p>
                    <p>Suite à votre troisième oubli consécutif de validation collective de votre prise de service à la Régulation, un signalement a été transmis à la Direction.</p>
                    <p>La Direction RH va prochainement vous convoquer pour un <strong>Entretien Disciplinaire</strong>.</p>
                    <p>Vous recevrez un email confirmant la date et l'heure de cet entretien dès qu'un Administrateur aura planifié l'événement.</p>
                </div>
            `,
            signatureHtml: `
                <div class="signature-name">Direction RH</div>
                <div>VDF Ambulance</div>
            `
        }).catch(console.error);
    }

    // 3. Email d'Alerte aux Administrateurs pour Création Manuelle de la Convocation
    const admins = await prisma.user.findMany({
        where: { roles: { has: 'ADMIN' } },
        select: { email: true }
    });

    for (const admin of admins) {
        if (admin.email) {
            await sendBrandedEmail({
                to: admin.email,
                from: '"Alerte Système VDF" <vdf95rh@gmail.com>',
                bcc: 'rezan.selva@gmail.com',
                subject: `🚨 [Action RH Requise] 3 Oublis atteints pour ${fullName}`,
                title: `Alerte Disciplinaire`,
                preheader: `Le collaborateur a atteint 3 oublis.`,
                content: `
                    <p>Veuillez noter que le collaborateur <strong>${fullName}</strong> vient d'atteindre son 3ème oubli de validation Régulation.</p>
                    <p><strong>Action requise de votre part :</strong></p>
                    <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 15px;">
                        <ul style="margin: 0; padding-left: 20px;">
                            <li>Connectez-vous à votre espace Administrateur.</li>
                            <li>Allez dans l'onglet "Rendez-vous" de l'Espace RH.</li>
                            <li>Créez manuellement une nouvelle <strong style="color: #b91c1c;">Convocation RH</strong> pour ce salarié.</li>
                        </ul>
                    </div>
                `,
                signatureHtml: `<div class="signature-name">Le Système de Régulation Automatique</div>`
            }).catch(console.error);
        }
    }
}

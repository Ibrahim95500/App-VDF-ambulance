import { prisma } from '@/lib/prisma';
import { sendTelegramMessage } from '@/lib/telegram/telegram-api';
import { startOfDay, endOfDay, addDays, format } from 'date-fns';

export async function handleUserCommand(chatId: string | number, text: string, user: any) {
    const cmd = text.toLowerCase().trim();

    try {
        if (cmd === '/menu' || cmd === '/start') {
            const menuText = `🚑 <b>Menu Principal VDF Ambulance</b>\n\nQue souhaitez-vous consulter ?\n\n`
                + `💶 /acompte - Voir mes demandes d'acompte (En cours)\n`
                + `🛠 /service - Voir mes demandes de service\n`
                + `📅 /rdv - Voir mes rendez-vous direction\n`
                + `🚑 /regul - Afficher ma régulation pour DEMAIN`;
            
            await sendTelegramMessage(chatId, menuText);
            return;
        }

        if (cmd === '/acompte') {
            const acomptes = await prisma.advanceRequest.findMany({
                where: { userId: user.id, status: 'PENDING' },
                orderBy: { createdAt: 'desc' }
            });

            if (acomptes.length === 0) {
                await sendTelegramMessage(chatId, "💶 Vous n'avez aucune demande d'acompte <b>en cours</b>.");
                return;
            }

            let responseText = `💶 <b>Vos Demandes d'Acomptes en attente :</b>\n\n`;
            acomptes.forEach((a: any, i: number) => {
                responseText += `${i+1}. <b>${a.amount} €</b> pour ${a.targetMonth}\n`;
            });
            await sendTelegramMessage(chatId, responseText);
            return;
        }

        if (cmd === '/service') {
            const services = await prisma.serviceRequest.findMany({
                where: { userId: user.id, status: 'PENDING' },
                orderBy: { createdAt: 'desc' }
            });

            if (services.length === 0) {
                await sendTelegramMessage(chatId, "🛠 Vous n'avez aucune demande de service <b>en cours</b>.");
                return;
            }

            let responseText = `🛠 <b>Vos Demandes de Service en attente :</b>\n\n`;
            services.forEach((s: any, i: number) => {
                responseText += `${i+1}. <b>${s.subject}</b> (${s.category || 'Autre'})\n`;
            });
            await sendTelegramMessage(chatId, responseText);
            return;
        }

        if (cmd === '/rdv') {
            const rdvs = await prisma.appointmentRequest.findMany({
                where: { userId: user.id, status: 'PENDING' },
                orderBy: { createdAt: 'desc' }
            });

            if (rdvs.length === 0) {
                await sendTelegramMessage(chatId, "📅 Vous n'avez aucun rendez-vous direction de prévu ou en attente.");
                return;
            }

            let responseText = `📅 <b>Vos RDV Direction (En attente de validation) :</b>\n\n`;
            rdvs.forEach((r: any, i: number) => {
                responseText += `${i+1}. <b>Type:</b> ${r.type}\n   <b>Motif:</b> ${r.reason}\n`;
            });
            await sendTelegramMessage(chatId, responseText);
            return;
        }

        if (cmd === '/regul') {
            const tomorrow = addDays(new Date(), 1);
            const mission = await prisma.planningAssignment.findFirst({
                where: {
                    date: { gte: startOfDay(tomorrow), lte: endOfDay(tomorrow) },
                    OR: [
                        { leaderId: user.id },
                        { teammateId: user.id }
                    ]
                },
                include: {
                    vehicle: true,
                    leader: true,
                    teammate: true
                }
            });

            const regulation = await prisma.regulationAssignment.findFirst({
                where: { userId: user.id, date: { gte: startOfDay(tomorrow), lte: endOfDay(tomorrow) } }
            });

            const dispo = await prisma.disponibility.findFirst({
                where: { userId: user.id, date: { gte: startOfDay(tomorrow), lte: endOfDay(tomorrow) } }
            });

            let responseText = `📍 <b>MISSION DU ${format(tomorrow, 'dd/MM/yyyy')}</b>\n\n`;

            if (mission) {
                const role = mission.leaderId === user.id ? '🎯 Leader' : '🤝 Équipier';
                const colleague = mission.leaderId === user.id ? mission.teammate : mission.leader;
                const validatedStr = (mission.leaderId === user.id && mission.leaderValidated) || (mission.teammateId === user.id && mission.teammateValidated) 
                    ? "✅ <b>VALIDÉE</b>" : "⏳ <b>EN ATTENTE DE VALIDATION</b>";

                responseText += `🚐 <b>Equipage :</b> ${mission.vehicle?.plateNumber}\n`;
                responseText += `👤 <b>Votre Rôle :</b> ${role}\n`;
                if(colleague) responseText += `🧑‍🤝‍🧑 <b>Binôme :</b> ${colleague.firstName} ${colleague.name}\n`;
                if(mission.startTime && mission.endTime) responseText += `⏰ <b>Horaires :</b> ${mission.startTime} - ${mission.endTime}\n`;
                responseText += `\nStatut: ${validatedStr}\n`;
                
                await sendTelegramMessage(chatId, responseText);
                return;
            } else if (regulation) {
                const validatedStr = regulation.validated ? "✅ <b>VALIDÉE</b>" : "⏳ <b>EN ATTENTE DE VALIDATION</b>";
                responseText += `🎧 <b>Rôle :</b> Régulateur\n`;
                responseText += `🔄 <b>Type :</b> ${regulation.type}\n`;
                responseText += `⏰ <b>Début :</b> ${regulation.startTime}\n`;
                responseText += `\nStatut: ${validatedStr}\n`;
                await sendTelegramMessage(chatId, responseText);
                return;
            } else if (dispo) {
                const validatedStr = dispo.validated ? "✅ <b>VALIDÉE</b>" : "⏳ <b>EN ATTENTE DE VALIDATION</b>";
                responseText += `🏠 <b>Rôle :</b> Employé Disponible (Astreinte)\n`;
                responseText += `⏰ <b>Début :</b> ${dispo.startTime}\n`;
                responseText += `\nStatut: ${validatedStr}\n`;
                await sendTelegramMessage(chatId, responseText);
                return;
            } else {
                await sendTelegramMessage(chatId, `📭 Vous n'avez actuellement <b>aucune mission ou affectation</b> programmée pour le ${format(tomorrow, 'dd/MM/yyyy')}.`);
                return;
            }
        }

        // Si la commande n'est pas reconnue mais commence par /
        if (cmd.startsWith('/')) {
            await sendTelegramMessage(chatId, "❌ Commande introuvable. Tapez /menu pour voir les options disponibles.");
        } else {
            // Un simple message texte (sans slash) par exemple : "Salut"
            await sendTelegramMessage(chatId, "Appuyez sur /menu pour naviguer dans vos demandes VDF Ambulance.");
        }

    } catch(e: any) {
        console.error("Erreur Telegram Handle Command:", e);
        await sendTelegramMessage(chatId, "⚠️ Une erreur technique est survenue en lisant les informations. (Code: T102)");
    }
}

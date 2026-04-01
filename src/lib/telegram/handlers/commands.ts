import { prisma } from '@/lib/prisma';
import { sendTelegramMessage } from '@/lib/telegram/telegram-api';
import { startOfDay, endOfDay, addDays, format } from 'date-fns';

export async function handleUserCommand(chatId: string | number, text: string, user: any) {
    const cmd = text.toLowerCase().trim();

    try {
        if (cmd === '/menu' || cmd === '/start' || cmd === '🧹 recommencer (/start)') {
            // Nettoyage de l'état si l'utilisateur était bloqué dans un tunnel
            await prisma.user.update({
                where: { id: user.id },
                data: { telegramState: null, telegramStateData: null }
            });

            const menuText = `👋 <b>Conversation réinitialisée.</b>\n\n🚑 <b>Menu Principal VDF Ambulance</b>\n\nUtilisez le <b>clavier persistant</b> en bas de l'écran pour naviguer :\n\n`
                + `👉 <b>Ma Régulation</b> : Voir ma mission de demain.\n`
                + `👉 <b>Mes Acomptes</b> : Voir ou faire des demandes d'acompte.\n`
                + `👉 <b>Mes Services</b> : Déclarer un incident ou besoin matériel.\n`
                + `👉 <b>Mes RDV</b> : Consulter vos rendez-vous direction.\n`
                + `👉 <b>Mon Profil</b> : Afficher vos statistiques et informations.\n\n`
                + `<i>Astuce: Telegram ne permet pas à un bot d'effacer les messages de votre écran. Pour faire place nette, vous devez faire "Vider l'historique" depuis les options Telegram.</i>`;

            // On renvoie le MainMenu au cas où il aurait été perdu
            const { sendMainMenu } = require('@/lib/telegram/telegram-api');
            await sendMainMenu(chatId, menuText, user.roles);
            return;
        }

        if (cmd === '/acompte' || cmd === '💶 mes acomptes') {
            const acomptes = await prisma.advanceRequest.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: 'desc' },
                take: 5
            });

            const inline_keyboard = [];
            acomptes.forEach((a: any) => {
                let icon = a.status === 'PENDING' ? '⏳' : (a.status === 'APPROVED' ? '✅' : '❌');
                inline_keyboard.push([{ text: `${icon} ${a.amount}€ (${a.targetMonth})`, callback_data: `VIEW_ACOMPTE_${a.id}` }]);
            });
            inline_keyboard.push([{ text: "📝 Faire une nouvelle demande", callback_data: "CREATE_ACOMPTE" }]);

            const msg = acomptes.length > 0 
                ? "💶 <b>Historique de vos Acomptes (5 derniers)</b>\nCliquez sur un acompte pour voir les détails :" 
                : "💶 Vous n'avez aucun historique d'acompte.\nCréez votre première demande ci-dessous :";

            await sendTelegramMessage(chatId, msg, { inline_keyboard });
            return;
        }

        if (cmd === '/service' || cmd === '🛠 mes services') {
            const services = await prisma.serviceRequest.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: 'desc' },
                take: 5
            });

            const inline_keyboard = [];
            services.forEach((s: any) => {
                let icon = s.status === 'PENDING' ? '⏳' : (s.status === 'APPROVED' ? '✅' : '❌');
                const title = s.subject.length > 20 ? s.subject.substring(0, 18) + '..' : s.subject;
                inline_keyboard.push([{ text: `${icon} ${title}`, callback_data: `VIEW_SERVICE_${s.id}` }]);
            });
            inline_keyboard.push([{ text: "🛠 Faire une nouvelle demande", callback_data: "CREATE_SERVICE" }]);

            const msg = services.length > 0 
                ? "🛠 <b>Historique de vos Services (5 derniers)</b>\nCliquez sur un service pour voir les détails :" 
                : "🛠 Vous n'avez aucun historique de service.\nCréez votre première demande ci-dessous :";

            await sendTelegramMessage(chatId, msg, { inline_keyboard });
            return;
        }

        if (cmd === '/rdv' || cmd === '📅 mes rdv') {
            const rdvs = await prisma.appointmentRequest.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: 'desc' },
                take: 5
            });

            const inline_keyboard = [];
            rdvs.forEach((r: any) => {
                let icon = r.status === 'PENDING' ? '⏳' : (r.status === 'APPROVED' ? '✅' : '❌');
                const title = r.reason.length > 20 ? r.reason.substring(0, 18) + '..' : r.reason;
                inline_keyboard.push([{ text: `${icon} ${title}`, callback_data: `VIEW_RDV_${r.id}` }]);
            });
            inline_keyboard.push([{ text: "📅 Demander un Rendez-vous", callback_data: "CREATE_RDV" }]);

            const msg = rdvs.length > 0 
                ? "📅 <b>Historique de vos RDV Direction (5 derniers)</b>\nCliquez sur un RDV pour voir les détails :" 
                : "📅 Vous n'avez aucun historique de RDV.\nPrenez votre premier rendez-vous ci-dessous :";

            await sendTelegramMessage(chatId, msg, { inline_keyboard });
            return;
        }

        if (cmd === '/convocation') {
            if (!user.roles.includes('ADMIN') && !user.roles.includes('RH')) {
                await sendTelegramMessage(chatId, "⚠️ Vous n'avez pas les droits pour convoquer un collaborateur.");
                return;
            }
            
            const collab = await prisma.user.findMany({
                where: { isActive: true, NOT: { roles: { hasSome: ['ADMIN'] } } },
                select: { id: true, firstName: true, lastName: true },
                orderBy: { firstName: 'asc' }
            });
            
            if (collab.length === 0) {
                await sendTelegramMessage(chatId, "❌ Aucun collaborateur éligible à convoquer.");
                return;
            }

            const inline_keyboard = [];
            collab.slice(0, 95).forEach(c => {
                inline_keyboard.push([{ text: `👤 ${c.firstName || ''} ${c.lastName || ''}`, callback_data: `CONVU_${c.id}` }]);
            });

            await sendTelegramMessage(chatId, "🎯 <b>Convoquer un salarié (1/5)</b>\n\nSélectionnez le collaborateur à convoquer :", { inline_keyboard });
            return;
        }

        if (cmd === '/regul' || cmd === '🚑 ma régulation') {
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
                
                const now = new Date();
                const formatter = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', hour12: false });
                const currentHour = parseInt(formatter.format(now));
                const isValidTime = currentHour >= 19 && currentHour < 21; // Seulement 19:xx et 20:xx

                let keyboard = undefined;
                if ((mission.leaderId === user.id && !mission.leaderValidated) || (mission.teammateId === user.id && !mission.teammateValidated)) {
                    if (isValidTime) {
                        keyboard = {
                            inline_keyboard: [[{ text: "✅ Confirmer ma mission", callback_data: `VALIDATE_MISSION_${mission.id}` }]]
                        };
                    } else {
                        responseText += `\n<i>⚠️ La validation de votre mission ne sera possible qu'entre 19h00 et 21h00. Revenez ici à ce moment-là.</i>\n`;
                    }
                }
                
                await sendTelegramMessage(chatId, responseText, keyboard);
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

        // --- NOUVEAUX MENUS ---

        if (cmd === '/profil' || cmd === '👤 mon profil') {
            const roleLabels = user.roles.join(', ') || 'SALARIÉ';
            const profileText = `👤 <b>MON PROFIL COMPLET</b>\n\n`
                + `<b>Nom :</b> ${user.firstName || ''} ${user.lastName || user.name || ''}\n`
                + `<b>Rôle(s) :</b> ${roleLabels}\n`
                + `<b>Email :</b> ${user.email || 'Non renseigné'}\n`
                + `<b>Téléphone :</b> ${user.phone || 'Non renseigné'}\n\n`
                + `<i>Si une de ces informations est incorrecte, merci de contacter la Direction.</i>`;
            await sendTelegramMessage(chatId, profileText);
            return;
        }

        if (cmd === '/collaborateurs' || cmd === '👥 collaborateurs') {
            const isAdminOrRH = user.roles?.includes('ADMIN') || user.roles?.includes('RH');
            if (!isAdminOrRH) {
                await sendTelegramMessage(chatId, "⛔️ Accès réservé aux Administrateurs et RH.");
                return;
            }

            const inline_keyboard = [
                [{ text: "🔵 Équipe MARK", callback_data: `C_FILTER_MARK` }, { text: "🟢 Équipe VDF", callback_data: `C_FILTER_VDF` }],
                [{ text: "🟣 Les Volants (Les 2)", callback_data: `C_FILTER_LES_2` }],
                [{ text: "👥 Lister Tout le Monde", callback_data: `C_FILTER_ALL` }]
            ];

            const keyboard = { inline_keyboard };
            await sendTelegramMessage(chatId, `💼 <b>Annuaire des Collaborateurs</b>\nChoisissez la structure à consulter :`, keyboard);
            return;
        }

        if (cmd === '/plan' || cmd === '👁 plan du jour') {
            const isAdminOrRH = user.roles?.includes('ADMIN') || user.roles?.includes('RH');
            if (!isAdminOrRH) {
                await sendTelegramMessage(chatId, "⛔️ Accès réservé aux Administrateurs et RH.");
                return;
            }

            const today = new Date();
            const dateStr = format(today, 'yyyy-MM-dd');
            const startOfToday = new Date(`${dateStr}T00:00:00.000Z`);
            const endOfToday = new Date(`${dateStr}T23:59:59.999Z`);

            const assignments = await prisma.planningAssignment.findMany({
                where: {
                    date: { gte: startOfToday, lte: endOfToday }
                },
                include: {
                    vehicle: true,
                    leader: true,
                    teammate: true
                },
                orderBy: { startTime: 'asc' }
            });

            if (assignments.length === 0) {
                await sendTelegramMessage(chatId, `📭 <b>Plan d'Aujourd'hui (${format(today, 'dd/MM/yyyy')})</b>\nAucun équipage n'a été assigné pour le moment.`);
                return;
            }

            let responseText = `📅 <b>PLAN D'AUJOURD'HUI (${format(today, 'dd/MM/yyyy')})</b>\n\n`;
            
            assignments.forEach(a => {
                const shift = a.startTime === '05:30' ? '☀️ (Jour)' : (a.startTime === '19:30' ? '🌙 (Nuit)' : `⏰ (${a.startTime || 'Non défini'})`);
                responseText += `🚐 <b>${a.vehicle?.plateNumber}</b> ${shift}\n`;
                responseText += `  L: ${a.leader?.lastName || a.leader?.name || 'Inconnu'}\n`;
                responseText += `  C: ${a.teammate?.lastName || a.teammate?.name || 'Inconnu'}\n`;
                responseText += `  <i>Statut: ${a.status}</i>\n\n`;
            });

            const keyboard = {
                inline_keyboard: [[{ text: "📅 Plan de Demain", callback_data: "VIEW_PLAN_TOMORROW" }]]
            };

            await sendTelegramMessage(chatId, responseText, keyboard);
            return;
        }

        if (cmd === '/regul_bot' || cmd === '🤖 régulation (bot)') {
            const isAdminOrRH = user.roles?.includes('ADMIN') || user.roles?.includes('RH');
            if (!isAdminOrRH) {
                await sendTelegramMessage(chatId, "⛔️ Accès réservé aux Administrateurs et RH.");
                return;
            }

            // Démarrage du Wizard : Etape 1 -> Le Date du Planning
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    telegramState: 'REGUL_DATE',
                    telegramStateData: JSON.stringify({}) // On initialise le conteneur vide
                }
            });

            const keyboard = {
                inline_keyboard: [
                    [{ text: "📅 Aujourd'hui", callback_data: "REGUL_DATE_TODAY" }],
                    [{ text: "📅 Demain", callback_data: "REGUL_DATE_TOMORROW" }],
                    [{ text: "❌ Annuler", callback_data: "CANCEL_ACTION" }]
                ]
            };

            await sendTelegramMessage(chatId, `🤖 <b>Mode Bot (Régulation)</b>\n\n<i>Étape 1/5</i> : Pour quelle date souhaitez-vous planifier un équipage ?`, keyboard);
            return;
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

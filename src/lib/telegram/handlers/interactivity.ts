import { prisma } from '@/lib/prisma';
import { sendTelegramMessage } from '@/lib/telegram/telegram-api';
import { createAdvanceRequest } from '@/actions/advance-request.actions';
import { createServiceRequest } from '@/actions/service-request.actions';
import { createAppointmentRequest } from '@/services/appointment-request';
import { createManyNotifications } from '@/actions/notifications.actions';
// --- GESTION DES CLICS SUR LES BOUTONS ---
export async function handleBotCallback(chatId: string | number, dataAction: string, user: any, messageId: number) {
    try {
        if (dataAction === 'CREATE_ACOMPTE') {
            await prisma.user.update({
                where: { id: user.id },
                data: { telegramState: 'ACOMPTE_MONTANT', telegramStateData: '{}' }
            });
            await sendTelegramMessage(chatId, "💶 <b>Nouvelle demande d'Acompte</b>\n\nSaisissez le montant désiré (en chiffres, ex: 150) :");
            return;
        }

        if (dataAction === 'CREATE_SERVICE') {
            await prisma.user.update({
                where: { id: user.id },
                data: { telegramState: 'SERVICE_SUBJECT', telegramStateData: '{}' }
            });
            await sendTelegramMessage(chatId, "🛠 <b>Nouvelle demande de Service</b>\n\nQuel est le sujet de votre demande ? (ex: Problème de matériel)");
            return;
        }

        if (dataAction === 'CREATE_RDV') {
            await prisma.user.update({
                where: { id: user.id },
                data: { telegramState: 'RDV_TYPE', telegramStateData: '{}' }
            });
            const keyboard = {
                inline_keyboard: [
                    [{ text: "🤝 Entretien Annuel", callback_data: "RDVTYPE_ENTRETIEN_ANNUEL" }],
                    [{ text: "💰 Augmentation / Salaire", callback_data: "RDVTYPE_AUGMENTATION_SALAIRE" }],
                    [{ text: "⚖️ Conflit / Médiation", callback_data: "RDVTYPE_CONFLIT_MEDIATION" }],
                    [{ text: "📄 Fin de contrat / Démission", callback_data: "RDVTYPE_DEMISSION" }],
                    [{ text: "❓ Autre motif", callback_data: "RDVTYPE_RENDEZ_VOUS" }]
                ]
            };
            await sendTelegramMessage(chatId, "📅 <b>Nouveau Rendez-vous Direction</b>\n\nQuel est le but principal de ce rendez-vous ?", keyboard);
            return;
        }

        if (dataAction.startsWith('RDVTYPE_')) {
            const rdvType = dataAction.replace('RDVTYPE_', '');
            await prisma.user.update({
                where: { id: user.id },
                data: { 
                    telegramState: 'RDV_REASON', 
                    telegramStateData: JSON.stringify({ type: rdvType }) 
                }
            });
            await sendTelegramMessage(chatId, "📝 <b>Le contexte :</b>\nVeuillez préciser le contexte de votre demande : (Pourquoi avez-vous besoin de ce rendez-vous ?)");
            return;
        }

        if (dataAction.startsWith('VALIDATE_MISSION_')) {
            const now = new Date();
            const formatter = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', hour12: false });
            const currentHour = parseInt(formatter.format(now));
            
            if (currentHour < 19 || currentHour >= 21) {
                await sendTelegramMessage(chatId, "⚠️ <b>Action refusée :</b> La validation de mission n'est autorisée qu'entre 19h00 et 21h00.");
                return;
            }

            const missionId = dataAction.split('_')[2];
            
            // Trouver la mission pour confirmer
            const mission = await prisma.planningAssignment.findUnique({ where: { id: missionId } });
            if (!mission) {
                await sendTelegramMessage(chatId, "❌ Impossible de trouver cette mission.");
                return;
            }

            // Mettre à jour la validation
            if (mission.leaderId === user.id) {
                await prisma.planningAssignment.update({
                    where: { id: missionId },
                    data: { leaderValidated: true, leaderValidatedAt: new Date() }
                });
            } else if (mission.teammateId === user.id) {
                await prisma.planningAssignment.update({
                    where: { id: missionId },
                    data: { teammateValidated: true, teammateValidatedAt: new Date() }
                });
            }
            
            // Envoyer un message de succès
            await sendTelegramMessage(chatId, "✅ <b>Mission validée avec succès !</b> Merci de votre confirmation.");
            return;
        }

        // --- ETAPES DE CONFIRMATION (REDO/UNDO) ---
        if (dataAction === 'CONFIRM_ACOMPTE') {
            if (user.telegramState !== 'ACOMPTE_CONFIRM') {
                await sendTelegramMessage(chatId, "⚠️ Session expirée ou action non valide.");
                return;
            }
            const stateData = user.telegramStateData ? JSON.parse(user.telegramStateData) : {};
            const result = await createAdvanceRequest(stateData.amount, stateData.reason, user.id);
            
            await prisma.user.update({ where: { id: user.id }, data: { telegramState: null, telegramStateData: null } });
            
            if (!result.success) {
                await sendTelegramMessage(chatId, `❌ <b>Demande refusée :</b>\n${result.error}`);
            } else {
                await sendTelegramMessage(chatId, `✅ <b>Félicitations !</b>\nVotre demande d'acompte de ${stateData.amount} € a été envoyée avec succès aux Ressources Humaines.`);
            }
            return;
        }

        if (dataAction === 'CONFIRM_SERVICE') {
            if (user.telegramState !== 'SERVICE_CONFIRM') {
                await sendTelegramMessage(chatId, "⚠️ Session expirée ou action non valide.");
                return;
            }
            const stateData = user.telegramStateData ? JSON.parse(user.telegramStateData) : {};
            try {
                await createServiceRequest('Telegram', stateData.subject, stateData.desc, user.id);
                await sendTelegramMessage(chatId, `✅ <b>Demande de service envoyée !</b>\nElle a été transmise à la supervision RH.`);
            } catch (err: any) {
                await sendTelegramMessage(chatId, `❌ <b>Erreur :</b>\n${err.message || "Impossible de créer la demande."}`);
            } finally {
                await prisma.user.update({ where: { id: user.id }, data: { telegramState: null, telegramStateData: null } });
            }
            return;
        }

        if (dataAction === 'CONFIRM_RDV') {
            if (user.telegramState !== 'RDV_CONFIRM') {
                await sendTelegramMessage(chatId, "⚠️ Session expirée ou action non valide.");
                return;
            }
            const stateData = user.telegramStateData ? JSON.parse(user.telegramStateData) : {};
            
            try {
                // Utilisation de l'import static
                const newRdv = await createAppointmentRequest({
                    userId: user.id,
                    type: stateData.type || 'RENDEZ_VOUS',
                    reason: stateData.reason || "Via Bot",
                    description: "Demande initiée via le chatbot Telegram"
                });
                
                // Notifications globales
                const rhAdmins = await prisma.user.findMany({
                    where: { OR: [{ roles: { has: 'RH' } }, { roles: { has: 'ADMIN' } }] }
                });
                
                await createManyNotifications(
                    rhAdmins.map((adm: any) => adm.id),
                    "Nouveau RDV (Telegram) 📅",
                    `${user.firstName || ''} ${user.lastName || ''} demande un rdv : ${stateData.reason}`,
                    "APPOINTMENT",
                    `/dashboard/rh/rdv/${newRdv.id}`
                ).catch(() => {});

                for (const adm of rhAdmins) {
                    if (adm.telegramChatId) {
                        await sendTelegramMessage(adm.telegramChatId, `📅 <b>Nouveau RDV demandé</b>\nPar : ${user.firstName || ''} ${user.lastName || ''}\nMotif : ${stateData.reason}`).catch(() => {});
                    }
                }

                await sendTelegramMessage(chatId, `✅ <b>Demande de Rendez-vous envoyée !</b>\nLa Direction examinera votre motif dans les plus brefs délais.`);
            } catch (err: any) {
                console.error("Erreur Telegram createAppointment:", err);
                await sendTelegramMessage(chatId, `❌ <b>Erreur :</b>\n${err.message || "Impossible de faire la demande."}`);
            } finally {
                await prisma.user.update({ where: { id: user.id }, data: { telegramState: null, telegramStateData: null } });
            }
            return;
        }

        if (dataAction.startsWith('VIEW_PROFILE_')) {
            const profileId = dataAction.split('_')[2];
            const profile = await prisma.user.findUnique({ where: { id: profileId } });
            
            if (!profile) {
                await sendTelegramMessage(chatId, "❌ Profil introuvable.");
                return;
            }

            const roleLabels = profile.roles.join(', ') || 'SALARIÉ';
            const profileText = `👤 <b>PROFIL : ${profile.firstName || ''} ${profile.lastName || profile.name || ''}</b>\n\n`
                + `<b>UUID :</b> ${profile.id}\n`
                + `<b>Rôle(s) :</b> ${roleLabels}\n`
                + `<b>Structure :</b> ${profile.structure || 'Non définie'}\n`
                + `<b>Email :</b> ${profile.email || 'Non renseigné'}\n`
                + `<b>Téléphone :</b> ${profile.phone || 'Non renseigné'}\n`
                + `<b>Lié Telegram :</b> ${profile.telegramChatId ? '✅ Oui' : '❌ Non'}\n`;

            // On pourrait rajouter un inline keyboard "Retour Liste" si nécessaire
            await sendTelegramMessage(chatId, profileText);
            return;
        }

        if (dataAction.startsWith('VIEW_ACOMPTE_')) {
            const id = dataAction.split('_')[2];
            const acompte = await prisma.advanceRequest.findUnique({ where: { id } });
            if (!acompte) return sendTelegramMessage(chatId, "❌ Acompte introuvable.");
            
            const formatter = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit' });
            const dateStr = formatter.format(new Date(acompte.createdAt));
            let icon = acompte.status === 'PENDING' ? '⏳' : (acompte.status === 'APPROVED' ? '✅' : '❌');
            
            const txt = `💶 <b>Détails de l'Acompte</b>\n\n`
                + `<b>Date :</b> ${dateStr}\n`
                + `<b>Montant :</b> ${acompte.amount} €\n`
                + `<b>Mois ciblé :</b> ${acompte.targetMonth}\n`
                + `<b>Statut :</b> ${icon} ${acompte.status}\n`
                + (acompte.adminComment ? `\n💬 <b>Commentaire RH :</b> ${acompte.adminComment}` : "");
            await sendTelegramMessage(chatId, txt);
            return;
        }

        if (dataAction.startsWith('VIEW_SERVICE_')) {
            const id = dataAction.split('_')[2];
            const service = await prisma.serviceRequest.findUnique({ where: { id } });
            if (!service) return sendTelegramMessage(chatId, "❌ Service introuvable.");
            
            const formatter = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit' });
            const dateStr = formatter.format(new Date(service.createdAt));
            let icon = service.status === 'PENDING' ? '⏳' : (service.status === 'APPROVED' ? '✅' : '❌');
            
            const txt = `🛠 <b>Détails du Service</b>\n\n`
                + `<b>Date :</b> ${dateStr}\n`
                + `<b>Catégorie :</b> ${service.category || 'Non défini'}\n`
                + `<b>Sujet :</b> ${service.subject}\n`
                + `<b>Message :</b> ${service.description}\n`
                + `<b>Statut :</b> ${icon} ${service.status}\n`
                + (service.adminComment ? `\n💬 <b>Commentaire RH :</b> ${service.adminComment}` : "");
            await sendTelegramMessage(chatId, txt);
            return;
        }

        if (dataAction.startsWith('VIEW_RDV_')) {
            const id = dataAction.split('_')[2];
            const rdv = await prisma.appointmentRequest.findUnique({ where: { id } });
            if (!rdv) return sendTelegramMessage(chatId, "❌ RDV introuvable.");
            
            const formatter = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit' });
            const dateStr = formatter.format(new Date(rdv.createdAt));
            let icon = rdv.status === 'PENDING' ? '⏳' : (rdv.status === 'APPROVED' ? '✅' : '❌');
            let dateFixe = rdv.appointmentDate ? formatter.format(new Date(rdv.appointmentDate)) : "Non fixée";

            const txt = `📅 <b>Détails du RDV Direction</b>\n\n`
                + `<b>Date de la demande :</b> ${dateStr}\n`
                + `<b>Type :</b> ${rdv.type}\n`
                + `<b>Motif :</b> ${rdv.reason}\n`
                + `<b>Statut :</b> ${icon} ${rdv.status}\n`
                + `<b>Date fixée :</b> ${dateFixe}\n`
                + (rdv.adminComment ? `\n💬 <b>Commentaire RH :</b> ${rdv.adminComment}` : "");
            await sendTelegramMessage(chatId, txt);
            return;
        }
        if (dataAction.startsWith('C_FILTER_')) {
            const isAdminOrRH = user.roles?.includes('ADMIN') || user.roles?.includes('RH');
            if (!isAdminOrRH) {
                await sendTelegramMessage(chatId, "⛔️ Accès réservé aux Administrateurs et RH.");
                return;
            }

            const filterState = dataAction.replace('C_FILTER_', '');
            let whereClause: any = { isDeleted: false };
            if (filterState !== 'ALL') {
                whereClause.structure = filterState;
            }

            const usersList = await prisma.user.findMany({
                where: whereClause,
                orderBy: { lastName: 'asc' }
            });

            if (usersList.length === 0) {
                await sendTelegramMessage(chatId, "Aucun collaborateur trouvé pour ce filtre.");
                return;
            }

            // Construction du Clavier Inline avec icônes
            const inline_keyboard = [];
            for (let i = 0; i < usersList.length; i += 2) {
                const row = [];

                const buildBtn = (u: any) => {
                    let icon = "👤"; 
                    if (u.structure === 'MARK') icon = '🔵';
                    else if (u.structure === 'VDF') icon = '🟢';
                    else if (u.structure === 'LES_2') icon = '🟣';
                    
                    const fullName = `${u.firstName || ''} ${u.lastName || u.name || ''}`.trim();
                    // On tronque le nom s'il est trop long pour le bouton
                    const display = fullName.length > 20 ? fullName.substring(0, 18) + '..' : fullName;
                    return { text: `${icon} ${display}`, callback_data: `VIEW_PROFILE_${u.id}` };
                };

                row.push(buildBtn(usersList[i]));
                if (i + 1 < usersList.length) {
                    row.push(buildBtn(usersList[i+1]));
                }
                inline_keyboard.push(row);
            }
            // Ajouter un bouton retour
            inline_keyboard.push([{ text: "🔙 Retour Filtres", callback_data: "BACK_COLLAB_MENU" }]);

            let titleTxt = "👥 <b>Tous les Collaborateurs</b>";
            if (filterState === 'MARK') titleTxt = "🔵 <b>Équipe MARK Ambulance</b>";
            if (filterState === 'VDF') titleTxt = "🟢 <b>Équipe VDF Ambulance</b>";
            if (filterState === 'LES_2') titleTxt = "🟣 <b>Équipe Volante (Les 2)</b>";

            const keyboard = { inline_keyboard };
            await sendTelegramMessage(chatId, `${titleTxt}\nSélectionnez une personne pour voir sa fiche complète :`, keyboard);
            return;
        }

        if (dataAction === 'BACK_COLLAB_MENU') {
            const inline_keyboard = [
                [{ text: "🔵 Équipe MARK", callback_data: `C_FILTER_MARK` }, { text: "🟢 Équipe VDF", callback_data: `C_FILTER_VDF` }],
                [{ text: "🟣 Les Volants (Les 2)", callback_data: `C_FILTER_LES_2` }],
                [{ text: "👥 Lister Tout le Monde", callback_data: `C_FILTER_ALL` }]
            ];
            const keyboard = { inline_keyboard };
            await sendTelegramMessage(chatId, `💼 <b>Annuaire des Collaborateurs</b>\nChoisissez la structure à consulter :`, keyboard);
            return;
        }

        if (dataAction === 'VIEW_PLAN_TODAY') {
            const isAdminOrRH = user.roles?.includes('ADMIN') || user.roles?.includes('RH');
            if (!isAdminOrRH) {
                await sendTelegramMessage(chatId, "⛔️ Accès réservé aux Administrateurs.");
                return;
            }

            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            const startOfToday = new Date(`${todayStr}T00:00:00.000Z`);
            const endOfToday = new Date(`${todayStr}T23:59:59.999Z`);

            const assignments = await prisma.planningAssignment.findMany({
                where: { date: { gte: startOfToday, lte: endOfToday } },
                include: { vehicle: true, leader: true, teammate: true },
                orderBy: { startTime: 'asc' }
            });

            const formatter = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            if (assignments.length === 0) {
                await sendTelegramMessage(chatId, `📭 <b>Plan d'Aujourd'hui (${formatter.format(startOfToday)})</b>\nAucun équipage n'a été assigné.`);
                return;
            }

            let responseText = `📅 <b>PLAN D'AUJOURD'HUI (${formatter.format(startOfToday)})</b>\n\n`;
            assignments.forEach(a => {
                const shift = a.startTime === '05:30' ? '☀️ (Jour)' : (a.startTime === '19:30' ? '🌙 (Nuit)' : `⏰ (${a.startTime || 'Non défini'})`);
                responseText += `🚐 <b>${a.vehicle?.plateNumber}</b> ${shift}\n`;
                responseText += `  L: ${a.leader?.lastName || a.leader?.name || 'Inconnu'}\n`;
                responseText += `  C: ${a.teammate?.lastName || a.teammate?.name || 'Inconnu'}\n`;
                responseText += `  <i>Statut: ${a.status}</i>\n\n`;
            });
            await sendTelegramMessage(chatId, responseText);
            return;
        }

        if (dataAction === 'VIEW_PLAN_TOMORROW') {
            const isAdminOrRH = user.roles?.includes('ADMIN') || user.roles?.includes('RH');
            if (!isAdminOrRH) {
                await sendTelegramMessage(chatId, "⛔️ Accès réservé aux Administrateurs et RH.");
                return;
            }

            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            const tomorrowStr = tomorrow.toISOString().split('T')[0];
            const startOfTomorrow = new Date(`${tomorrowStr}T00:00:00.000Z`);
            const endOfTomorrow = new Date(`${tomorrowStr}T23:59:59.999Z`);

            const assignments = await prisma.planningAssignment.findMany({
                where: {
                    date: { gte: startOfTomorrow, lte: endOfTomorrow }
                },
                include: {
                    vehicle: true,
                    leader: true,
                    teammate: true
                },
                orderBy: { startTime: 'asc' }
            });

            const formatter = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            if (assignments.length === 0) {
                await sendTelegramMessage(chatId, `📭 <b>Plan de Demain (${formatter.format(startOfTomorrow)})</b>\nAucun équipage n'a été assigné pour le moment.`);
                return;
            }

            let responseText = `📅 <b>PLAN DE DEMAIN (${formatter.format(startOfTomorrow)})</b>\n\n`;
            
            assignments.forEach(a => {
                const shift = a.startTime === '05:30' ? '☀️ (Jour)' : (a.startTime === '19:30' ? '🌙 (Nuit)' : `⏰ (${a.startTime || 'Non défini'})`);
                responseText += `🚐 <b>${a.vehicle?.plateNumber}</b> ${shift}\n`;
                responseText += `  L: ${a.leader?.lastName || a.leader?.name || 'Inconnu'}\n`;
                responseText += `  C: ${a.teammate?.lastName || a.teammate?.name || 'Inconnu'}\n`;
                responseText += `  <i>Statut: ${a.status}</i>\n\n`;
            });

            await sendTelegramMessage(chatId, responseText);
            return;
        }

        // --- WIZARD RÉGULATION BOT (ADMIN) ---
        if (dataAction.startsWith('REGUL_')) {
            const isAdminOrRH = user.roles?.includes('ADMIN') || user.roles?.includes('RH');
            if (!isAdminOrRH) {
                await sendTelegramMessage(chatId, "⛔️ Accès réservé aux Administrateurs.");
                return;
            }

            const stateData = user.telegramStateData ? JSON.parse(user.telegramStateData) : {};

            // Étape 1 à 2 : Date -> Shift
            if (dataAction === 'REGUL_DATE_TODAY' || dataAction === 'REGUL_DATE_TOMORROW') {
                const isToday = dataAction === 'REGUL_DATE_TODAY';
                const targetDate = new Date();
                if (!isToday) targetDate.setDate(targetDate.getDate() + 1);
                stateData.dateStr = targetDate.toISOString().split('T')[0];

                await prisma.user.update({
                    where: { id: user.id },
                    data: { telegramState: 'REGUL_SHIFT', telegramStateData: JSON.stringify(stateData) }
                });

                const keyboard = {
                    inline_keyboard: [
                        [{ text: "☀️ JOUR (05:30)", callback_data: "REGUL_SHIFT_JOUR" }],
                        [{ text: "🌙 NUIT (19:30)", callback_data: "REGUL_SHIFT_NUIT" }],
                        [{ text: "❌ Annuler", callback_data: "CANCEL_ACTION" }]
                    ]
                };
                await sendTelegramMessage(chatId, `🤖 <i>Étape 2/5</i> : Quel Shift pour cette mission ?`, keyboard);
                return;
            }

            // Étape 2 à 3 : Shift -> Véhicules
            if (dataAction === 'REGUL_SHIFT_JOUR' || dataAction === 'REGUL_SHIFT_NUIT') {
                stateData.startTime = dataAction === 'REGUL_SHIFT_JOUR' ? '05:30' : '19:30';
                
                await prisma.user.update({
                    where: { id: user.id },
                    data: { telegramState: 'REGUL_VEHICLE', telegramStateData: JSON.stringify(stateData) }
                });

                const vehicles = await prisma.vehicle.findMany({ orderBy: { plateNumber: 'asc' } });
                const inline_keyboard = [];
                for (let i = 0; i < vehicles.length; i += 2) {
                    const row = [];
                    row.push({ text: `🚐 ${vehicles[i].plateNumber}`, callback_data: `REGUL_VEHI_${vehicles[i].id}` });
                    if (vehicles[i+1]) {
                        row.push({ text: `🚐 ${vehicles[i+1].plateNumber}`, callback_data: `REGUL_VEHI_${vehicles[i+1].id}` });
                    }
                    inline_keyboard.push(row);
                }
                inline_keyboard.push([{ text: "❌ Annuler", callback_data: "CANCEL_ACTION" }]);

                await sendTelegramMessage(chatId, `🤖 <i>Étape 3/5</i> : Assignez un véhicule pour ce shift :`, { inline_keyboard });
                return;
            }

            // Étape 3 à 4 : Véhicule -> Leader
            if (dataAction.startsWith('REGUL_VEHI_')) {
                stateData.vehicleId = dataAction.replace('REGUL_VEHI_', '');

                await prisma.user.update({
                    where: { id: user.id },
                    data: { telegramState: 'REGUL_LEADER', telegramStateData: JSON.stringify(stateData) }
                });

                const users = await prisma.user.findMany({
                    where: { isActive: true, roles: { hasSome: ['SALARIE', 'ADMIN', 'RH', 'REGULATEUR'] } },
                    orderBy: { lastName: 'asc' }
                });

                const inline_keyboard = [];
                for (let i = 0; i < users.length; i += 2) {
                    const row = [];
                    const n1 = `${users[i].lastName || ''} ${users[i].firstName || ''}`.trim();
                    row.push({ text: `🎯 ${n1}`, callback_data: `REGUL_LEAD_${users[i].id}` });
                    if (users[i+1]) {
                        const n2 = `${users[i+1].lastName || ''} ${users[i+1].firstName || ''}`.trim();
                        row.push({ text: `🎯 ${n2}`, callback_data: `REGUL_LEAD_${users[i+1].id}` });
                    }
                    inline_keyboard.push(row);
                }
                inline_keyboard.push([{ text: "❌ Annuler", callback_data: "CANCEL_ACTION" }]);

                await sendTelegramMessage(chatId, `🤖 <i>Étape 4/5</i> : Choisissez le RESPONSABLE (Leader) :`, { inline_keyboard });
                return;
            }

            // Étape 4 à 5 : Leader -> Co-équipier
            if (dataAction.startsWith('REGUL_LEAD_')) {
                stateData.leaderId = dataAction.replace('REGUL_LEAD_', '');

                await prisma.user.update({
                    where: { id: user.id },
                    data: { telegramState: 'REGUL_TEAM', telegramStateData: JSON.stringify(stateData) }
                });

                const users = await prisma.user.findMany({
                    where: { isActive: true, roles: { hasSome: ['SALARIE', 'ADMIN', 'RH', 'REGULATEUR'] }, id: { not: stateData.leaderId } },
                    orderBy: { lastName: 'asc' }
                });

                const inline_keyboard = [];
                for (let i = 0; i < users.length; i += 2) {
                    const row = [];
                    const n1 = `${users[i].lastName || ''} ${users[i].firstName || ''}`.trim();
                    row.push({ text: `🤝 ${n1}`, callback_data: `REGUL_TEAM_${users[i].id}` });
                    if (users[i+1]) {
                        const n2 = `${users[i+1].lastName || ''} ${users[i+1].firstName || ''}`.trim();
                        row.push({ text: `🤝 ${n2}`, callback_data: `REGUL_TEAM_${users[i+1].id}` });
                    }
                    inline_keyboard.push(row);
                }
                inline_keyboard.push([{ text: "Aucun co-équipier (Seul)", callback_data: "REGUL_TEAM_NONE" }]);
                inline_keyboard.push([{ text: "❌ Annuler", callback_data: "CANCEL_ACTION" }]);

                await sendTelegramMessage(chatId, `🤖 <i>Étape 5/5</i> : Choisissez le CO-ÉQUIPIER (ou Seul) :`, { inline_keyboard });
                return;
            }

            // Étape Finale : Co-équipier -> Sauvegarde
            if (dataAction.startsWith('REGUL_TEAM_')) {
                const teammateId = dataAction.replace('REGUL_TEAM_', '');
                const finalTeammateId = teammateId === 'NONE' ? stateData.leaderId : teammateId; // Si seul, teammateId = leaderId pour ne pas casser la base non-nullable (si elle l'est)
                
                try {
                    // Les dates en base (Planner) sont toujours UTC 00h
                    const startOfTargetDate = new Date(`${stateData.dateStr}T00:00:00.000Z`);
                    
                    // Vérification Anti-Doublon
                    const isNight = stateData.startTime === '19:30';
                    const existing = await prisma.planningAssignment.findFirst({
                        where: {
                            vehicleId: stateData.vehicleId,
                            date: startOfTargetDate,
                            startTime: isNight ? { gte: "12:00" } : { lt: "12:00" }
                        },
                        include: { leader: true, vehicle: true }
                    });

                    if (existing) {
                        await sendTelegramMessage(chatId, `🚫 <b>ERREUR :</b> L'ambulance <b>${existing.vehicle?.plateNumber}</b> a DÉJÀ un équipage assigné à cette date sur cette vacation (Leader: ${existing.leader?.lastName || '?'}).\n<i>Veuillez modifier ou supprimer via la WebApp.</i>`, {
                            inline_keyboard: [
                                [{ text: "❌ Quitter", callback_data: "CANCEL_ACTION" }]
                            ]
                        });
                        // On nettoie le state pour ne pas rester bloqué
                        await prisma.user.update({
                            where: { id: user.id },
                            data: { telegramState: null, telegramStateData: null }
                        });
                        return;
                    }

                    await prisma.planningAssignment.create({
                        data: {
                            date: startOfTargetDate,
                            vehicleId: stateData.vehicleId,
                            startTime: stateData.startTime,
                            endTime: stateData.startTime === '05:30' ? '18:00' : '05:00', // par défaut pour affichage
                            leaderId: stateData.leaderId,
                            teammateId: finalTeammateId,
                            status: 'PENDING'
                        }
                    });

                    await sendTelegramMessage(chatId, `✅ <b>Équipage créé avec succès !</b>\nIl est enregistré pour le ${stateData.dateStr}.`, {
                        inline_keyboard: [
                            [{ text: "👁 Voir Plan", callback_data: stateData.dateStr === new Date().toISOString().split('T')[0] ? "VIEW_PLAN_TODAY" : "VIEW_PLAN_TOMORROW" }],
                            [{ text: "📝 Autre équipage", callback_data: "REGUL_DATE_TOMORROW" }]
                        ]
                    });
                } catch (e) {
                    console.error("Erreur de création Régul Telegram", e);
                    await sendTelegramMessage(chatId, "❌ Erreur base de données lors de la sauvegarde.");
                } finally {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { telegramState: null, telegramStateData: null }
                    });
                }
                return;
            }
        }

        // Action générique d'annulation
        if (dataAction === 'CANCEL_ACTION') {
            await prisma.user.update({
                where: { id: user.id },
                data: { telegramState: null, telegramStateData: null }
            });
            await sendTelegramMessage(chatId, "❌ Opération annulée.");
            return;
        }

        await sendTelegramMessage(chatId, "⚠️ Bouton non reconnu ou expiré.");
    } catch (e) {
        console.error("Erreur Telegram Callback:", e);
        await sendTelegramMessage(chatId, "⚠️ Erreur lors de l'exécution de l'action.");
    }
}

// --- GESTION DE LA MACHINE A ÉTATS DE CONVERSATION ---
export async function handleConversationState(chatId: string | number, text: string, user: any) {
    const currentState = user.telegramState;
    const stateData = user.telegramStateData ? JSON.parse(user.telegramStateData) : {};

    try {
        // Option pour annuler n'importe quand
        if (text.toLowerCase() === '/annuler' || text.toLowerCase() === 'annuler') {
            await prisma.user.update({
                where: { id: user.id },
                data: { telegramState: null, telegramStateData: null }
            });
            await sendTelegramMessage(chatId, "❌ Action annulée.");
            return;
        }

        // --- FLUX DE CRÉATION : ACOMPTE ---
        if (currentState === 'ACOMPTE_MONTANT') {
            const amount = parseFloat(text.replace(',', '.'));
            if (isNaN(amount) || amount <= 0) {
                await sendTelegramMessage(chatId, "❌ Format invalide. Saisissez uniquement un montant valide (ex: 200). Tapez /annuler pour stopper.");
                return;
            }
            stateData.amount = amount;
            await prisma.user.update({
                where: { id: user.id },
                data: { telegramState: 'ACOMPTE_REASON', telegramStateData: JSON.stringify(stateData) }
            });
            await sendTelegramMessage(chatId, `Vous avez demandé <b>${amount} €</b>.\n\nQuel est le motif de cette demande ? (ex: Frais de véhicule)`);
            return;
        }

        if (currentState === 'ACOMPTE_REASON') {
            stateData.reason = text;
            await prisma.user.update({
                where: { id: user.id },
                data: { telegramState: 'ACOMPTE_CONFIRM', telegramStateData: JSON.stringify(stateData) }
            });

            const keyboard = {
                inline_keyboard: [
                    [{ text: "✅ Confirmer et Envoyer", callback_data: "CONFIRM_ACOMPTE" }],
                    [{ text: "❌ Annuler", callback_data: "CANCEL_ACTION" }]
                ]
            };

            const summary = `📄 <b>RÉCAPITULATIF DE VOTRE DEMANDE D'ACOMPTE</b>\n\n`
                + `<b>Montant :</b> ${stateData.amount} €\n`
                + `<b>Motif :</b> ${text}\n\n`
                + `<i>Souhaitez-vous confirmer l'envoi de cette demande aux RH ?</i>`;

            await sendTelegramMessage(chatId, summary, keyboard);
            return;
        }

        if (currentState === 'ACOMPTE_CONFIRM') {
            await sendTelegramMessage(chatId, "⚠️ Veuillez utiliser les boutons 'Confirmer' ou 'Annuler' ci-dessus. Ou tapez /annuler pour fermer.");
            return;
        }

        // --- FLUX DE CRÉATION : SERVICE ---
        if (currentState === 'SERVICE_SUBJECT') {
            if (text.length < 3) {
                await sendTelegramMessage(chatId, "❌ Le sujet est trop court. Merci de détailler. (Tapez /annuler pour stopper)");
                return;
            }
            stateData.subject = text;
            await prisma.user.update({
                where: { id: user.id },
                data: { telegramState: 'SERVICE_DESC', telegramStateData: JSON.stringify(stateData) }
            });
            await sendTelegramMessage(chatId, `Sujet : <b>${text}</b>\n\n📝 Pouvez-vous décrire votre demande en un seul message ?`);
            return;
        }

        if (currentState === 'SERVICE_DESC') {
            stateData.desc = text;
            await prisma.user.update({
                where: { id: user.id },
                data: { telegramState: 'SERVICE_CONFIRM', telegramStateData: JSON.stringify(stateData) }
            });

            const keyboard = {
                inline_keyboard: [
                    [{ text: "✅ Confirmer et Envoyer", callback_data: "CONFIRM_SERVICE" }],
                    [{ text: "❌ Annuler", callback_data: "CANCEL_ACTION" }]
                ]
            };

            const summary = `📄 <b>RÉCAPITULATIF DE VOTRE DEMANDE DE SERVICE</b>\n\n`
                + `<b>Sujet :</b> ${stateData.subject}\n`
                + `<b>Description :</b> ${text}\n\n`
                + `<i>Souhaitez-vous confirmer l'envoi de cette demande à la régulation/direction ?</i>`;

            await sendTelegramMessage(chatId, summary, keyboard);
            return;
        }

        if (currentState === 'SERVICE_CONFIRM') {
            await sendTelegramMessage(chatId, "⚠️ Veuillez utiliser les boutons 'Confirmer' ou 'Annuler' ci-dessus. Ou tapez /annuler pour fermer.");
            return;
        }

        // --- FLUX DE CRÉATION : RDV DIRECTION ---
        // Le Type a déjà été choisi via inline_keyboard (RDVTYPE_) => donc on arrive dans l'état RDV_REASON
        if (currentState === 'RDV_REASON') {
            if (text.length < 3) {
                await sendTelegramMessage(chatId, "❌ Votre motif est trop court. Décrivez un peu plus votre besoin (tapez /annuler pour stopper).");
                return;
            }
            stateData.reason = text;
            await prisma.user.update({
                where: { id: user.id },
                data: { telegramState: 'RDV_CONFIRM', telegramStateData: JSON.stringify(stateData) }
            });

            const keyboard = {
                inline_keyboard: [
                    [{ text: "✅ Confirmer et Envoyer", callback_data: "CONFIRM_RDV" }],
                    [{ text: "❌ Annuler", callback_data: "CANCEL_ACTION" }]
                ]
            };

            const summary = `📄 <b>RÉCAPITULATIF DU RENDEZ-VOUS</b>\n\n`
                + `<b>Type  :</b> ${stateData.type}\n`
                + `<b>Motif :</b> ${text}\n\n`
                + `<i>Souhaitez-vous confirmer l'envoi de cette demande à la Direction ?</i>`;

            await sendTelegramMessage(chatId, summary, keyboard);
            return;
        }

        if (currentState === 'RDV_CONFIRM') {
            await sendTelegramMessage(chatId, "⚠️ Veuillez utiliser les boutons 'Confirmer' ou 'Annuler' ci-dessus. Ou tapez /annuler pour fermer.");
            return;
        }

    } catch (e) {
        console.error("Erreur Telegram Conversation:", e);
        // Fallback safety
        await prisma.user.update({
            where: { id: user.id },
            data: { telegramState: null, telegramStateData: null }
        });
        await sendTelegramMessage(chatId, "⚠️ Une erreur technique a interrompu la demande. Veuillez recommencer.");
    }
}

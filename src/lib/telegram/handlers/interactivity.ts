import { prisma } from '@/lib/prisma';
import { sendTelegramMessage } from '@/lib/telegram/telegram-api';
import { createAdvanceRequest } from '@/actions/advance-request.actions';
import { createServiceRequest } from '@/actions/service-request.actions';
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

        if (dataAction.startsWith('VALIDATE_MISSION_')) {
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
            // Appel à l'action native pour appliquer toutes les règles (ex: limite au 15 du mois)
            const result = await createAdvanceRequest(stateData.amount, text, user.id);

            // Vider l'état
            await prisma.user.update({
                where: { id: user.id },
                data: { telegramState: null, telegramStateData: null }
            });

            if (!result.success) {
                await sendTelegramMessage(chatId, `❌ <b>Demande refusée par le système :</b>\n${result.error}`);
                return;
            }

            await sendTelegramMessage(chatId, `✅ <b>Félicitations !</b>\nVotre demande d'acompte de ${stateData.amount} € a été envoyée avec succès aux Ressources Humaines.`);
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
            try {
                await createServiceRequest('Telegram', stateData.subject, text, user.id);

                await prisma.user.update({
                    where: { id: user.id },
                    data: { telegramState: null, telegramStateData: null }
                });

                await sendTelegramMessage(chatId, `✅ <b>Demande de service envoyée !</b>\nElle a été transmise à la supervision RH.`);
            } catch (err: any) {
                await sendTelegramMessage(chatId, `❌ <b>Erreur :</b>\n${err.message || "Impossible de créer la demande."}`);
            }
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

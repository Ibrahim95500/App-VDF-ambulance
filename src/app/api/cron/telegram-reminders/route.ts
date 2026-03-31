import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendTelegramMessage } from '@/lib/telegram/telegram-api';
import { addDays, startOfDay, endOfDay, format } from 'date-fns';

export async function GET(request: Request) {
    try {
        console.log("--- START TELEGRAM CRON REMINDERS ---");
        
        // Sécurité par variable d'environnement (facultatif mais recommandé)
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get('secret');
        if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const tomorrow = addDays(new Date(), 1);
        const start = startOfDay(tomorrow);
        const end = endOfDay(tomorrow);

        // 1. Récupérer toutes les missions de demain (Planning)
        const planningAssignments = await prisma.planningAssignment.findMany({
            where: { date: { gte: start, lte: end } },
            include: { leader: true, teammate: true, vehicle: true }
        });

        // 2. Récupérer toutes les régulations de demain
        const regulations = await prisma.regulationAssignment.findMany({
            where: { date: { gte: start, lte: end } },
            include: { user: true }
        });

        // 3. Récupérer les dispos de demain
        const dispos = await prisma.disponibility.findMany({
            where: { date: { gte: start, lte: end } },
            include: { user: true }
        });

        let messagesSent = 0;

        // Fonction helper pour envoyer et compter
        const notify = async (chatId: string | null, message: string, keyboard?: any) => {
            if (chatId) {
                try {
                    await sendTelegramMessage(chatId, message, keyboard);
                    messagesSent++;
                } catch (e) {
                    console.error(`Failed to send reminder to ${chatId}:`, e);
                }
            }
        };

        const todayFormatted = format(tomorrow, 'dd/MM/yyyy');

        // Notification: MISSIONS
        for (const mission of planningAssignments) {
            let baseMessage = `🌙 <b>Bonsoir ! Votre programme VDF Ambulance pour demain (${todayFormatted}) :</b>\n\n`;
            baseMessage += `🚐 Vehicule : ${mission.vehicle?.plateNumber}\n`;
            if (mission.startTime && mission.endTime) baseMessage += `⏰ Horaires : ${mission.startTime} - ${mission.endTime}\n\n`;
            
            // Leader
            if (!mission.leaderValidated && mission.leader?.telegramChatId) {
                const msg = baseMessage + `👤 Votre rôle : Leader\n👉 <b>Veuillez valider votre régulation dès maintenant.</b>`;
                const keyboard = { inline_keyboard: [[{ text: "✅ Confirmer ma mission", callback_data: `VALIDATE_MISSION_${mission.id}` }]] };
                await notify(mission.leader.telegramChatId, msg, keyboard);
            }
            // Teammate
            if (!mission.teammateValidated && mission.teammate?.telegramChatId) {
                const msg = baseMessage + `👤 Votre rôle : Équipier\n👉 <b>Veuillez valider votre régulation dès maintenant.</b>`;
                const keyboard = { inline_keyboard: [[{ text: "✅ Confirmer ma mission", callback_data: `VALIDATE_MISSION_${mission.id}` }]] };
                await notify(mission.teammate.telegramChatId, msg, keyboard);
            }
        }

        // Notification: REGULATION
        for (const reg of regulations) {
            if (!reg.validated && reg.user?.telegramChatId) {
                let msg = `🌙 <b>Bonsoir ! Vous êtes planifié en Régulation pour demain (${todayFormatted}) :</b>\n\n`;
                msg += `🔄 Type : ${reg.type}\n⏰ Début : ${reg.startTime}\n👉 <b>Veuillez valider depuis votre application VDF.</b>`;
                // Pas de bouton natif pour Regulateur implémenté pour l'instant (à venir potentiellement)
                await notify(reg.user.telegramChatId, msg);
            }
        }

        // Notification: DISPO (Astreinte)
        for (const dispo of dispos) {
            if (!dispo.validated && dispo.user?.telegramChatId) {
                let msg = `🌙 <b>Bonsoir ! Vous êtes marqué "Disponible" pour demain (${todayFormatted}) :</b>\n\n`;
                msg += `⏰ À partir de : ${dispo.startTime}\n👉 <b>Veuillez valider cette disponibilité sur l'app.</b>`;
                await notify(dispo.user.telegramChatId, msg);
            }
        }

        console.log(`--- CRON REMINDERS DONE. Messages sent: ${messagesSent} ---`);
        return NextResponse.json({ success: true, messagesSent });
    } catch (e: any) {
        console.error("CRON Telegram Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

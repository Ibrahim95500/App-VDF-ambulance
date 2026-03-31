import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendTelegramMessage, sendRequestContactKeyboard, removeReplyKeyboard } from '@/lib/telegram/telegram-api';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Sécurité de base, si c'est pas un message, on l'ignore (Telegram envoie d'autres events parfois)
        if (!body.message) {
            return NextResponse.json({ ok: true });
        }

        const msg = body.message;
        const chatId = msg.chat.id;
        const text = msg.text || '';
        const contact = msg.contact; // C'est ici que Firebase va envoyer l'objet Contact contenant le numero de telephone

        // --- SCÉNARIO 1 : L'UTILISATEUR VIENT D'ENVOYER SON NUMÉRO VIA LE BOUTON ---
        if (contact && contact.phone_number) {
            // Nettoyage: Telegram peut renvoyer "+33612345678" ou "33612345678" ou "0612345678"
            // On va essayer de faire matcher les derniers 9 chiffres pour ne pas s'embêter avec les préfixes internationaux
            let phoneStr = contact.phone_number.replace(/\s+/g, '').replace('+', '');
            const cleanSuffix = phoneStr.slice(-9); // Les 9 derniers chiffres (ex: 612345678 pour 06 12 34 56 78)

            console.log(`[Telegram Auth] Tentative de connexion avec le suffixe tel : ${cleanSuffix} depuis le chat ${chatId}`);

            // Recherche en base : un User dont le numéro finit par ces 9 chiffres
            const matchedUsers = await prisma.user.findMany({
                where: {
                    phone: {
                        endsWith: cleanSuffix
                    }
                }
            });

            if (matchedUsers.length > 0) {
                const user = matchedUsers[0];
                
                // Mettre à jour la base de données avec le Chat ID Telegram
                await prisma.user.update({
                    where: { id: user.id },
                    data: { telegramChatId: String(chatId) }
                });

                await removeReplyKeyboard(chatId, `✅ Bienvenue sur le réseau sécurisé VDF Ambulance, <b>${user.firstName || user.name}</b> ! Votre compte télégraphique est désormais lié avec succès à votre profil RH.`);
                // Petit délai pour simuler "Loading..."
                setTimeout(() => {
                    sendTelegramMessage(chatId, "Voulez-vous tester les commandes disponibles ?\nTapez <b>/demandes</b> pour voir si vous avez des missions.");
                }, 1000);
            } else {
                await removeReplyKeyboard(chatId, `❌ Échec. Je n'ai trouvé aucun compte collaborateur VDF Ambulance associé au numéro de téléphone finissant par ${cleanSuffix}.\nVeuillez mettre à jour votre profil sur le site web RH ou contacter votre administrateur avant de réessayer avec /start.`);
            }

            return NextResponse.json({ ok: true });
        }

        // --- SCÉNARIO 2 : L'UTILISATEUR TAPE /START ---
        if (text === '/start') {
            await sendRequestContactKeyboard(chatId, "👋 Bonjour et bienvenue sur le Bot Officiel de <b>VDF Ambulance</b>.\n\n🔒 <i>Accès Restreint :</i>\nPour vous identifier comme un de nos collaborateurs officiels en un clin d'œil, veuillez utiliser le bouton ci-dessous pour partager votre numéro de téléphone (celui enregistré auprès des RH) avec notre serveur sécurisé.");
            return NextResponse.json({ ok: true });
        }

        // --- SCÉNARIO 3 : VÉRIFICATION INITIALE AVANT AUTRES COMMANDES ---
        // Avant d'accepter toute autre commande, on vérifie s'il est loggé
        const existingUser = await prisma.user.findFirst({
            where: { telegramChatId: String(chatId) }
        });

        if (!existingUser) {
            await sendTelegramMessage(chatId, "⚠️ <b>Accès Refusé.</b>\nVous devez d'abord lier votre compte en tapant /start.");
            return NextResponse.json({ ok: true });
        }

        // (Les autres commandes viendront à l'Étape 2)
        if (text === '/demandes' || text === '/regul') {
            await sendTelegramMessage(chatId, "⏳ Outil en développement (Step 2). Les demandes s'afficheront ici très bientôt !");
        } else {
            // Message générique
            await sendTelegramMessage(chatId, "Je suis à votre écoute. Tapez /start pour réinitialiser ou patientez pour la mise à jour des commandes.");
        }

        return NextResponse.json({ ok: true });

    } catch (e: any) {
        console.error("Erreur Webhook Telegram:", e);
        return NextResponse.json({ ok: false, error: e.message });
    }
}

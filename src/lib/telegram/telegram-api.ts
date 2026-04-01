// src/lib/telegram/telegram-api.ts

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const URL_BASE = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

export async function sendTelegramMessage(chatId: string | number, text: string, replyMarkup?: any) {
    if (!TELEGRAM_TOKEN) {
        console.error("TELEGRAM_BOT_TOKEN is missing in environment variables.");
        return;
    }

    try {
        const body: any = {
            chat_id: chatId,
            text,
            parse_mode: 'HTML',
        };

        if (replyMarkup) {
            body.reply_markup = replyMarkup;
        }

        const response = await fetch(`${URL_BASE}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            console.error("Failed to send telegram message", await response.text());
        }
        
        return await response.json();
    } catch (e) {
        console.error("Telegram API Error:", e);
    }
}

// Fonction utilitaire pour envoyer le clavier qui demande le contact téléphonique
export async function sendRequestContactKeyboard(chatId: string | number, message: string) {
    const keyboard = {
        keyboard: [
            [{ text: "📞 Partager mon numéro pour m'identifier", request_contact: true }]
        ],
        one_time_keyboard: true,
        resize_keyboard: true
    };
    
    return sendTelegramMessage(chatId, message, keyboard);
}

// Nettoyer les claviers custom pour revenir aux boutons normaux inline
export async function removeReplyKeyboard(chatId: string | number, message: string) {
    const removeKeyboard = { remove_keyboard: true };
    return sendTelegramMessage(chatId, message, removeKeyboard);
}

// Envoyer le clavier permanent "Main Menu"
export async function sendMainMenu(chatId: string | number, message: string, roles: string[] = []) {
    const isAdminOrRH = roles.includes('ADMIN') || roles.includes('RH');

    const keyboardLayout: any[] = [
        [{ text: "🚑 Ma Régulation" }, { text: "📅 Mes RDV" }],
        [{ text: "💶 Mes Acomptes" }, { text: "🛠 Mes Services" }],
        [{ text: "👤 Mon Profil" }]
    ];

    if (isAdminOrRH) {
        // Menus dédiés aux Administrateurs et RH
        keyboardLayout.push([
            { text: "👥 Collaborateurs" }, 
            { text: "👁 Plan du Jour" }
        ]);
        keyboardLayout.push([
            { text: "🤖 Régulation (Bot)" },
            { text: "📝 Convoquer (Bot)" }
        ]);
        keyboardLayout.push([
            { text: "⚙️ Régulation (WebApp)", web_app: { url: "https://dev.vdf-ambulance.fr/dashboard/rh/regulation" } }
        ]);
    }

    // Bouton commun pour réinitialiser la session
    keyboardLayout.push([{ text: "🧹 Recommencer (/start)" }]);

    const replyMarkup = {
        keyboard: keyboardLayout,
        resize_keyboard: true,
        is_persistent: true
    };
    
    return sendTelegramMessage(chatId, message, replyMarkup);
}

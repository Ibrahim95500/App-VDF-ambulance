import { NextResponse } from 'next/server';

export async function GET() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!token) {
        return NextResponse.json({ 
            ok: false, 
            error: "TELEGRAM_BOT_TOKEN est manquant dans les variables d'environnement (.env) du serveur." 
        });
    }
    
    // Le domaine de l'application où le Webhook doit écouter
    const domain = "https://dev.vdf-ambulance.fr"; 
    const url = `${domain}/api/webhooks/telegram`;
    
    try {
        const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${url}`);
        const data = await res.json();
        
        return NextResponse.json({ 
            ok: data.ok, 
            message: data.ok ? "Le Webhook Telegram a été reconnecté avec succès !" : "Erreur lors de la connexion",
            telegramResponse: data 
        });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e.message });
    }
}

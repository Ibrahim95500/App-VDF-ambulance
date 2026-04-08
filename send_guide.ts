import { sendBrandedEmail } from "./src/lib/mail";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

async function send() {
    console.log("Envoi du mail de procédure d'installation...");
    
    // HTML de l'email
    const content = `
        <p>Bonjour,</p>
        <p>L'application mobile <strong>VDF Ambulance</strong> est officiellement lancée ! 🚑🎉</p>
        <p>Vous trouverez ci-dessous les instructions pour l'installer sur votre téléphone (iPhone ou Android) afin de commencer à recevoir vos courses directement dans votre poche.</p>
        
        <h3>📱 Pour installer sur iPhone (TestFlight)</h3>
        <ol>
            <li>Téléchargez l'application <strong>TestFlight</strong> depuis l'App Store Apple.</li>
            <li>Ouvrez l'email d'invitation Apple que vous avez reçu ou bien <strong>Cliquez sur le bouton ci-dessous</strong> pour rejoindre l'application.</li>
            <li>Cliquez sur <strong>Accepter</strong> puis <strong>Installer</strong>.</li>
            <li><i>(Si besoin, le code manuel est : <strong>HWBQFRJS</strong>)</i></li>
        </ol>

        <div style="text-align: center; margin: 30px 0;">
            <a href="https://testflight.apple.com/join/2UhkbKMn" style="background-color: #007aff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-family: sans-serif;">Installer sur iPhone</a>
        </div>

        <h3>🤖 Pour installer sur Android (PWA)</h3>
        <ol>
            <li>Ouvrez l'application <strong>Google Chrome</strong>.</li>
            <li>Allez sur le site : <a href="https://app.vdf-ambulance.fr">app.vdf-ambulance.fr</a></li>
            <li>Cliquez sur les <strong>3 petits points (⋮)</strong> en haut à droite de Chrome.</li>
            <li>Cliquez sur l'option <strong>"📲 Ajouter à l'écran d'accueil"</strong> ou <strong>"📥 Installer l'application"</strong>.</li>
            <li>Confirmez, et l'application s'installera avec vos autres applications !</li>
        </ol>

        <p><br><strong>⚠️ IMPORTANT :</strong> Lors du premier lancement, vous DEVEZ accepter les notifications pour recevoir vos courses.</p>
        <p>À très vite sur le terrain !</p>
    `;

    try {
        const result = await sendBrandedEmail({
            to: "vdf95rh@gmail.com",
            from: "VDF Ambulance <vdf95rh@gmail.com>",
            subject: "🚀 Lancement de l'Application VDF Ambulance - Procédure d'installation",
            title: "Lancement de l'Application",
            preheader: "Installez l'application VDF sur votre smartphone",
            content: content,
            actionUrl: "https://app.vdf-ambulance.fr",
            actionText: "Ouvrir l'application sur le Web"
        });

        if (result.success) {
            console.log("✅ Mail envoyé avec succès à vdf95rh@gmail.com !");
        } else {
            console.error("❌ Erreur d'envoi", result.error);
        }
    } catch (e) {
        console.error("Erreur script:", e);
    }
}

send();

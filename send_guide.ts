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
            <li>Allez sur le site : <a href="https://dev.vdf-ambulance.fr">dev.vdf-ambulance.fr</a></li>
            <li>Cliquez sur les <strong>3 petits points (⋮)</strong> en haut à droite de Chrome.</li>
            <li>Cliquez sur l'option <strong>"📲 Ajouter à l'écran d'accueil"</strong> ou <strong>"📥 Installer l'application"</strong>.</li>
            <li>Confirmez, et l'application s'installera avec vos autres applications !</li>
        </ol>

        <p><br><strong>⚠️ IMPORTANT :</strong> Lors du premier lancement, vous DEVEZ accepter les notifications pour recevoir vos courses.</p>
        <p>Veuillez retrouver le guide PDF complet en pièce jointe de cet email.</p>
        <p>À très vite sur le terrain !</p>
    `;

    const emails = [
        "amina.ramdani0104@gmail.com", "jordansiahmed@gmail.com", "mounia95190@hotmail.fr",
        "tedkwame@gmail.com", "vdf95rh@gmail.com", "rezan.selva@gmail.com", "absdu95@hotmail.fr",
        "b.abdel77@free.fr", "adam.mokretar93120@gmail.com", "ahmedelberkani34@gmail.com",
        "alassane.kone.kaba@gmail.com", "mabenz95140@gmail.com", "berthopresna@gmail.com",
        "blaoui.mohamed28@gmail.com", "bruno.horizon75@gmail.com", "christophe.lefaucon@gmail.com",
        "cici95400@hotmail.fr", "benmessaouddahmane8@gmail.com", "dimvdf@gmail.com", "Djidou93@gmail.com",
        "egain95@hotmail.fr", "Farhan.pro@outlook.fr", "gilbert66.hubert@gmail.com", "guyclaude97118@gmail.com",
        "halityuksel53@gmail.com", "hugueslouiserre@gmail.com", "ib2s95190@gmail.com", "jonathan.95500@hotmail.fr",
        "bossgwadada971@hotmail.fr", "juile.laussy@gmail.com", "madmad95@hotmail.fr", "MalikaSenini@gmail.com",
        "madou95190@hotmail.fr", "mehdi060780@gmail.com", "mehdibenaissa07@gmail.com", "mohamedisountoura@gmail.com",
        "nasser95140@gmail.com", "okanabay8@gmail.com", "imagpol@hotmail.fr", "rafik.tlem@gmail.com",
        "romualdrichard584@gmail.com", "serdalkaya1@outlook.fr", "elf.mohamed@outlook.fr", "r.sofian1991@gmail.com",
        "tahirkhan.pro@gmail.com", "tarekabdelkader1995@gmail.com", "tlemsani.mohamed13@gmail.com",
        "Naimmilhan@hotmail.com", "yannickfortin93@gmail.com", "william.ebeyer@gmail.com", "chakhrit.youcef@gmail.com"
    ];

    console.log(`Lancement de la campagne vers ${emails.length} collaborateurs...`);

    for (let i = 0; i < emails.length; i++) {
        const dest = emails[i];
        console.log(`[${i + 1}/${emails.length}] Envoi à ${dest}...`);
        try {
            const result = await sendBrandedEmail({
                to: dest,
                from: "VDF Ambulance <vdf95rh@gmail.com>",
                subject: "🚀 Lancement de l'Application VDF Ambulance - Procédure d'installation",
                title: "Lancement de l'Application",
                preheader: "Installez l'application VDF sur votre smartphone",
                content: content,
                actionUrl: "https://dev.vdf-ambulance.fr",
                actionText: "Ouvrir l'application sur le Web",
                attachments: [
                    {
                        filename: 'Guide_Installation_VDF.pdf',
                        path: path.join(__dirname, 'Guide_Installation_VDF.pdf'),
                        contentType: 'application/pdf'
                    }
                ]
            });

            if (result.success) {
                console.log(`✅ Mail envoyé avec succès à ${dest}`);
            } else {
                console.error(`❌ Erreur d'envoi pour ${dest}`);
            }
        } catch (e) {
            console.error(`Erreur critique pour ${dest}:`, e);
        }
        
        // Pause de 2 secondes pour éviter le blocage Spam de Gmail SMTP
        await new Promise(r => setTimeout(r, 2000));
    }
    
    console.log("🎉 CAMPAGNE TERMINÉE !");
}

send();

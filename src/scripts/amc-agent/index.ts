import puppeteer from 'puppeteer';
import * as dotenv from 'dotenv';
import path from 'path';

// Charge les variables d'environnement depuis le projet Next.js (.env)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const AMC_USERNAME = process.env.AMC_USERNAME;
const AMC_PASSWORD = process.env.AMC_PASSWORD;
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID; // À ajouter pour savoir à qui envoyer

// --- Utilitaires Telegram ---
async function sendTelegramAlert(text: string, photoBuffer?: Buffer) {
    if (!TELEGRAM_TOKEN || !TELEGRAM_ADMIN_CHAT_ID) {
        console.log("[TELEGRAM] Désactivé (Token ou Chat ID manquant).");
        return;
    }

    try {
        if (photoBuffer) {
            const formData = new FormData();
            formData.append('chat_id', TELEGRAM_ADMIN_CHAT_ID);
            formData.append('caption', text);
            formData.append('photo', new Blob([photoBuffer]), 'screenshot.png');

            await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`, {
                method: 'POST',
                body: formData
            });
        } else {
            await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: TELEGRAM_ADMIN_CHAT_ID, text: text, parse_mode: 'HTML' })
            });
        }
    } catch (e) {
        console.error("Erreur Telegram:", e);
    }
}
// -----------------------------

async function runSpyBot() {
    if (!AMC_USERNAME || !AMC_PASSWORD) {
        console.error("❌ Les identifiants AMC_USERNAME et AMC_PASSWORD sont manquants dans .env");
        process.exit(1);
    }

    console.log("🤖 Lancement de l'Agent AMC (Espion)...");
    await sendTelegramAlert("🤖 <b>Agent AMC Espion Démarré !</b>\nJe surveille les courses toutes les 15 secondes.");

    const browser = await puppeteer.launch({
        headless: true, // Navigateur invisible
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // Indispensable sur VPS Linux
    });

    const page = await browser.newPage();
    
    // Pour simuler un vrai navigateur
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    try {
        console.log("➡️ Connexion à Default.aspx...");
        await page.goto('https://transportpatient.fr/Default.aspx', { waitUntil: 'networkidle2' });

        // Attente du formulaire de connexion
        await page.waitForSelector('input[name*="Login"]', { timeout: 10000 });
        
        // Remplissage des identifiants (Les "name" ou "id" dépendent du code source exact, on vise large)
        // D'après la capture, les placeholders sont souvent "Login" et "Mot de passe"
        // Faisons une inspection générique :
        const loginInput = await page.$('input[type="text"]');
        const passInput = await page.$('input[type="password"]');
        const submitBtn = await page.$('input[type="submit"], button[type="submit"], a.btn');

        if (loginInput && passInput && submitBtn) {
            await loginInput.type(AMC_USERNAME);
            await passInput.type(AMC_PASSWORD);
            await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle2' }),
                submitBtn.click()
            ]);
            console.log("✅ Connecté !");
        } else {
            console.log("⚠️ Impossible de trouver le formulaire de connexion standard. Je tente de continuer.");
        }

        console.log("➡️ Navigation vers les Demandes à Traiter...");
        await page.goto('https://transportpatient.fr/Transport/TransporteurAtraiter.aspx?ModuleID=24', { waitUntil: 'networkidle2' });

        // Boucle infinie d'espionnage
        let loopCount = 0;
        while (true) {
            loopCount++;
            console.log(`[Recherche #${loopCount}] Analyse de la table...`);
            
            // On cherche le tableau des courses en attente
            // "Demandes en attente"
            const tableContent = await page.evaluate(() => {
                // Recherche d'un texte "Demandes en attente (X)"
                const headings = Array.from(document.querySelectorAll('div, h2, h3, h4, span, caption, th'));
                const attenteHeader = headings.find(el => el.textContent?.trim().startsWith('Demandes en attente ('));
                
                let count = 0;
                if (attenteHeader) {
                    const match = attenteHeader.textContent?.match(/\((\d+)\)/);
                    if (match && match[1]) count = parseInt(match[1]);
                }

                if (count === 0) {
                    // Fallback : vérifier si "Aucune donnée" est présent dans la PREMIERE DataTable ou s'il n'y a qu'une seule ligne (le Theader)
                    const tables = document.querySelectorAll('table.dataTable, table');
                    if (tables.length > 0) {
                        const firstTable = tables[0];
                        if ((firstTable.textContent || "").includes('Aucune donnée disponible')) return "VIDE";
                        
                        const rows = firstTable.querySelectorAll('tr');
                        // Si <= 1 ça veut dire qu'il n'y a que le header. Ou si =2 c'est le header + la ligne vide "Aucune donnée"
                        if (rows.length <= 1) return "VIDE"; 
                    } else {
                        return "VIDE"; // Pas de table du tout = vide
                    }
                }

                // S'il y a une course, on extrait le HTML de la première ligne de la première table
                const tables = document.querySelectorAll('table.dataTable, table');
                if (tables.length > 0) {
                    const firstTbody = tables[0].querySelector('tbody');
                    if (firstTbody) {
                        const actionButtons = firstTbody.querySelectorAll('a, button, input[type="image"], input[type="button"]');
                        if (actionButtons.length > 0) {
                            return Array.from(actionButtons).map(b => b.outerHTML).join('\n---\n');
                        }
                        return firstTbody.innerHTML; // Retourne tout le body si pas de bouton clair trouvé
                    }
                }

                return "COURSE DÉTECTÉE MAIS HTML INTROUVABLE";
            });

            if (tableContent !== "VIDE") {
                console.log("🚨🚨🚨 COURSE DETECTEE !!! 🚨🚨🚨");
                console.log("HTML des boutons:", tableContent);
                
                // Screenshot complet de la page pleine pour l'analyse
                const screenshotBuf = await page.screenshot({ fullPage: true });

                const alertMsg = `🚨 <b>COURSE AMC DÉTECTÉE !</b> 🚨\n\n<b>HTML Tiers Action :</b>\n<code>${tableContent.substring(0, 500)}</code>\n\n<i>Ceci est une capture du bot espion. La course n'a pas été acceptée.</i>`;
                await sendTelegramAlert(alertMsg, screenshotBuf as Buffer);

                console.log("📸 Screenshot envoyé ! Mise en pause de l'espionnage pour 5 minutes afin d'éviter le spam...");
                await new Promise(r => setTimeout(r, 5 * 60 * 1000)); // Pause de 5 min après une détection
            }

            // Rafraîchissement dans 15 secondes
            await new Promise(r => setTimeout(r, 15000));
            // Actualisation de la page ASP.NET (mieux que page.reload() pour WebForms parfois)
            await page.waitForSelector('body'); // Ensure page is somewhat loaded
            await page.goto('https://transportpatient.fr/Transport/TransporteurAtraiter.aspx?ModuleID=24', { waitUntil: 'domcontentloaded' });
        }

    } catch (e: any) {
        console.error("❌ ERREUR FATALE BOT:", e);
        await sendTelegramAlert(`❌ <b>Crash Agent AMC Espion:</b>\n${e.message}`);
    } finally {
        await browser.close();
    }
}

runSpyBot();

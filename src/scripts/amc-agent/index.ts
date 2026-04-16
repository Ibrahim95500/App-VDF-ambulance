import { chromium } from "playwright-extra"
import stealthPlugin from "puppeteer-extra-plugin-stealth"
chromium.use(stealthPlugin())
import dotenv from "dotenv"
import path from "path"
import fs from "fs"
import TelegramBot from "node-telegram-bot-api"

// Suppress telegram bot API deprecation warning logs
process.env.NTBA_FIX_350 = "1";

// Configuration
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })
dotenv.config()

const AMC_USERNAME = process.env.AMC_USERNAME || process.env.AMC_ID || "VDF"
const AMC_PASSWORD = process.env.AMC_PASSWORD || "Jordan95500!"
const AMC_URL = "https://transportpatient.fr/Transport/TransporteurAtraiter.aspx?ModuleID=24"

// Configuration Telegram Forcée pour BotPRTScrap (Mode Broadcast)
const TELEGRAM_BOT_TOKEN = "8648311380:AAGZA5FOqAJ1BE78o96RH4R1_eHCLxkAefs"
const TELEGRAM_CHAT_IDS = ["1634444351", "8679052160", "8457900796", "6171035866", "8744510527"]

// Écouteur Interactif Telegram
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true })
const manualClicks = new Set<string>()
const manualRejects = new Set<string>()
const alertedCourses = new Set<string>()
let isBotPaused = false;
let isBotDisconnected = false;
let isFilterActive = true;
const syncedAcceptedCourses = new Set<string>()
const activityMemory = new Set<string>()
let act_page: any = null;

const botKeyboard = {
    reply_markup: {
        keyboard: [
            [{ text: "▶️ Démarrer" }, { text: "⏸️ Pause" }],
            [{ text: "📊 État du Sniper" }],
            [{ text: "🔌 Déconnexion" }]
        ],
        resize_keyboard: true,
        is_persistent: true
    }
};

async function sendStatusReport(reqChatId?: number) {
    const isCo = !isBotDisconnected;
    const isPaused = isBotPaused;
    
    const now = new Date();
    const hours = now.getHours();
    const mins = now.getMinutes();
    const isMorningPause = (hours === 5 && mins >= 30) || (hours === 6) || (hours === 7 && mins === 0);
    
    let msg = "📊 *Rapport d'État - Sniper PRT*\n\n";
    const dateStr = now.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });
    msg += `🕒 *Heure* : ${dateStr}\n\n`;

    if (!isCo) {
        msg += `🔌 *Statut* : **DÉCONNECTÉ 🔴**\nLe robot dort profondément, la connexion au site est fermée.`;
        if (reqChatId) bot.sendMessage(reqChatId, msg, { parse_mode: 'Markdown' });
        else sendTelegramAlert(msg);
        return;
    }

    if (isMorningPause) {
        msg += `🛌 *Statut* : **PAUSE MATINALE (AUTOMATIQUE) 🔵**\nLe robot dort jusqu'à 07h00 tapante.`;
    } else if (isPaused) {
        msg += `⏸️ *Statut* : **EN PAUSE 🟡**\nLe robot est connecté au site mais le sniping est mis sur pause.`;
    } else {
        msg += `✅ *Statut* : **EN MISSION (SNIPING ACTIF) 🟢**\nLe robot scanne activement le radar PRT !`;
    }

    if (act_page) {
        try {
            const buf = await act_page.screenshot({ fullPage: true });
            if (reqChatId) {
                 bot.sendPhoto(reqChatId, buf as Buffer, { caption: msg, parse_mode: 'Markdown' }, { filename: 'status.png', contentType: 'image/png' });
            } else {
                 sendTelegramAlert(msg, buf as Buffer);
            }
        } catch(e) {
            msg += "\n\n❌ _Impossible de capturer l'écran pour l'instant (la navigation est en cours)._";
            if (reqChatId) bot.sendMessage(reqChatId, msg, { parse_mode: 'Markdown' });
            else sendTelegramAlert(msg);
        }
    } else {
        msg += "\n\n⏳ _Plateforme non initialisée._";
        if (reqChatId) bot.sendMessage(reqChatId, msg, { parse_mode: 'Markdown' });
        else sendTelegramAlert(msg);
    }
}

// Notification d'état toutes les heures (3600000 ms)
setInterval(() => {
    console.log("[TELEGRAM] Envoi du rapport d'état horaire automatique.");
    sendStatusReport();
}, 60 * 60 * 1000);

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text || "";
    console.log(`[TELEGRAM RADAR] Message reçu de ${msg.from?.first_name || 'Inconnu'} (ID: ${chatId}): ${text}`);

    if (text === '/stop' || text.includes('Pause')) {
        isBotPaused = true;
        bot.sendMessage(chatId, '🛑 **Robot mis en pause.** \n\n*Que se passe-t-il ?*\nLe robot reste connecté sur la page AMC de VDF, mais il se met dans un coin et arrête de cliquer sur "Rechercher". Il laisse l\'utilisateur manipuler le site sans le déconnecter. \n\nPour reprendre le sniping, clique sur Démarrer.', { parse_mode: 'Markdown', ...botKeyboard });
        return;
    }

    if (text === '/run' || text.includes('Démarrer')) {
        isBotPaused = false;
        if (isBotDisconnected) {
            isBotDisconnected = false;
            bot.sendMessage(chatId, '▶️ **Robot réactivé après Déconnexion.** \n\nJe lance le navigateur et me reconnecte au site AMC de zéro !', { parse_mode: 'Markdown', ...botKeyboard });
            return;
        }
        bot.sendMessage(chatId, '▶️ **Robot réactivé (Sniper ON).** \n\nJe reprends mon rôle de Sniper, je retourne cliquer sur le bouton de rafraîchissement au moindre nouveau radar !', { parse_mode: 'Markdown', ...botKeyboard });
        return;
    }

    if (text.includes('tat du Sniper')) {
        await sendStatusReport(chatId);
        return;
    }

    if (text.includes('Capture')) {
        if (act_page) {
            bot.sendMessage(chatId, "📸 *Prise de vue en cours, patiente une seconde...*", { parse_mode: 'Markdown' });
            try {
                const buf = await act_page.screenshot({ fullPage: true });
                await bot.sendPhoto(chatId, buf as Buffer);
            } catch (e) {
                bot.sendMessage(chatId, "❌ Impossible de capturer l'écran pour l'instant (le robot est probablement en pleine navigation).");
            }
        } else {
            bot.sendMessage(chatId, "⏳ Le robot n'est pas encore totalement connecté au site AMC.");
        }
        return;
    }

    if (text.includes('xion')) {
        isBotDisconnected = true;
        bot.sendMessage(chatId, "🔌 **Déconnexion totale accomplie.**\n\nLe robot AMC a fermé sa connexion internet. Le compte t'est rendu. Il restera profondément endormi jusqu'à ce que tu cliques sur **▶️ Démarrer**.", { parse_mode: 'Markdown' });
        if (act_page) {
            try { await act_page.close(); } catch (e) { }
        }
        return;
    }

    if (text === '/start' || text.toLowerCase().includes('salut')) {
        bot.sendMessage(chatId, `Salut ${msg.from?.first_name || ''} ! 🕵️‍♂️ L'Agent PRT de VDF est à ton service pour sniper les courses.\n\nUtilise le clavier ci-dessous pour piloter le robot en temps réel.`, botKeyboard);
    }
});

bot.on('callback_query', (query) => {
    if (query.data && query.data.startsWith('ACCEPT_')) {
        const courseId = query.data.replace('ACCEPT_', '')
        manualClicks.add(courseId)
        console.log(`[TELEGRAM] Demande manuelle reçue pour Accepter la course ${courseId} !`)

        bot.answerCallbackQuery(query.id, { text: "✅ Ordre reçu ! Dès le prochain balayage (15s max), je l'accepte s'il est encore là ! 🚀", show_alert: true })

        if (query.message) {
            bot.editMessageReplyMarkup({ inline_keyboard: [[{ text: `⏳ En cours d'acceptation de la course ${courseId}...`, callback_data: 'WAIT' }]] }, { chat_id: query.message.chat.id, message_id: query.message.message_id })
        }
    } else if (query.data && query.data.startsWith('ANNULER_')) {
        const courseId = query.data.replace('ANNULER_', '')
        manualRejects.add(courseId)
        console.log(`[TELEGRAM] Demande manuelle reçue pour Refuser la course ${courseId} !`)

        bot.answerCallbackQuery(query.id, { text: "❌ Ordre reçu ! Dès le prochain balayage (15s max), je la supprime ! 🗑️", show_alert: true })

        if (query.message) {
            bot.editMessageReplyMarkup({ inline_keyboard: [[{ text: `⏳ En cours de suppression de la course ${courseId}...`, callback_data: 'WAIT' }]] }, { chat_id: query.message.chat.id, message_id: query.message.message_id })
        }
    }
})

async function saveLog(status: string, screenshotBuffer: Buffer | null, depart: string, arrivee: string, num: string, demandeur: string = "", patient: string = "", datePec: string = "", heurePec: string = "", patientChoice?: boolean) {
    try {
        const formData = new FormData();
        formData.append("status", status);
        formData.append("depart", depart);
        formData.append("arrivee", arrivee);
        formData.append("num", num);
        if (demandeur) formData.append("demandeur", demandeur);
        if (patient) formData.append("patient", patient);
        if (datePec) formData.append("datePec", datePec);
        if (heurePec) formData.append("heurePec", heurePec);
        if (patientChoice !== undefined) formData.append("patientChoice", patientChoice ? "true" : "false");

        if (screenshotBuffer) {
            formData.append("image", new Blob([new Uint8Array(screenshotBuffer)], { type: "image/png" }), "screenshot.png");
        }

        // Envoi au NextJS local (127.0.0.1 pour forcer IPv4, car localhost fait planter Node 20)
        console.log(`[Dashboard] Envoi du log ${status} pour la course ${num}...`);
        const res = await fetch("http://127.0.0.1:8080/api/sniper", {
            method: "POST",
            body: formData
        });
        console.log(`[Dashboard] Réponse serveur : ${res.status} ${res.statusText}`);
    } catch (e) {
        console.error("❌ Erreur de transmission au Dashboard Web :", e);
    }
}

async function sendTelegramAlert(message: string, imageBuffer?: Buffer, courseId?: string) {
    if (!TELEGRAM_BOT_TOKEN || TELEGRAM_CHAT_IDS.length === 0) return;
    for (const chatId of TELEGRAM_CHAT_IDS) {
        try {
            const opts: any = { parse_mode: "Markdown" };
            if (courseId) {
                opts.reply_markup = {
                    inline_keyboard: [[
                        { text: "✅ Accepter", callback_data: `ACCEPT_${courseId}` },
                        { text: "❌ Refuser", callback_data: `ANNULER_${courseId}` }
                    ]]
                };
            }

            if (imageBuffer) {
                opts.caption = message;
                await bot.sendPhoto(chatId, imageBuffer, opts, { filename: 'screenshot.png', contentType: 'image/png' });
            } else {
                await bot.sendMessage(chatId, message, opts);
            }
        } catch (err: any) {
            console.error(`❌ Erreur Telegram au chat ${chatId}: ${err.message}`);
        }
    }
}

async function snipeCourse(page: any, withFilters: boolean = true): Promise<{ buffer: Buffer | null, status: string, num?: string, depart?: string, arrivee?: string, demandeur?: string }> {
    console.log("🎯 DÉBUT DU SNIPING ! Évaluation Chirurgicale des courses...")
    const manualClicksArray = Array.from(manualClicks);
    const alertedCoursesArray = Array.from(alertedCourses);
    const manualRejectsArray = Array.from(manualRejects);

    // Étape 1: Évaluer les lignes du tableau et filtrer
    const extraction = await page.evaluate(({ manualIds, alertedIds, manualRejectIds, withFilters }: { manualIds: string[], alertedIds: string[], manualRejectIds: string[], withFilters: boolean }) => {
        const allowedZipCodes = [
            "95500", "95400", "95200", "95140", "95380",
            "95190", "95470", "95270", "95700", "95440",
            "95350", "95670", "95720", "95570", "95850",
            "93290", "93440"
        ];

        let result = { clicked: false, isManual: false, isRejected: false, num: "", departText: "", arriveeText: "", demandeurText: "", foundNotVip: false, foundSunday: false, allNums: [] as string[] };

        const targetTable = document.querySelector('#AT_Affectation') || document;
        const theadRows = targetTable.querySelectorAll('thead tr');
        const headerTr = theadRows.length > 1 ? theadRows[1] : (theadRows[0] || targetTable);
        const headers = Array.from(headerTr.querySelectorAll('th'));
        const demandeurIdx = headers.findIndex((th: any) => (th.innerText || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes('demandeur'));
        const departIdx = headers.findIndex((th: any) => (th.innerText || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes('depart'));
        const arriveeIdx = headers.findIndex((th: any) => (th.innerText || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes('arrive'));
        const nIdx = headers.findIndex((th: any) => (th.innerText || "").trim().toLowerCase() === 'n°');
        const dateIdx = headers.findIndex((th: any) => (th.innerText || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes('date'));

        const rows = targetTable.querySelectorAll('tr');
        for (let row of rows) {
            const acceptBtn = row.querySelector('input[src*="valide"], input[src*="check"], img[src*="valide"], img[src*="check"], a[title*="accepter"], .fa-check, img[src*="V_Vert"]');

            if (acceptBtn && departIdx >= 0 && arriveeIdx >= 0 && nIdx >= 0) {
                const tds = row.querySelectorAll('td');
                if (tds.length > Math.max(departIdx, arriveeIdx, nIdx)) {
                    if (demandeurIdx >= 0) result.demandeurText = tds[demandeurIdx].innerText.trim();
                    result.departText = tds[departIdx].innerText.trim();
                    result.arriveeText = tds[arriveeIdx].innerText.trim();
                    result.num = tds[nIdx].innerText.trim();
                    result.allNums.push(result.num);

                    const isGonesseDepart = result.departText.toLowerCase().includes('gonesse') || result.departText.includes('95500');
                    const isAllowedArrivee = allowedZipCodes.some(zip => result.arriveeText.includes(zip));

                    const isVIP = withFilters ? (isGonesseDepart && isAllowedArrivee) : true;
                    const isManualTriggered = manualIds.includes(result.num);
                    const isManualRejected = manualRejectIds.includes(result.num);

                    let isSunday = false;
                    if (dateIdx >= 0 && tds.length > dateIdx) {
                        const dateText = tds[dateIdx].innerText.trim();
                        const m = dateText.match(/(\d{2})\/(\d{2})\/(\d{4})/);
                        if (m) {
                            const d = new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]));
                            if (d.getDay() === 0) isSunday = true;
                        } else if (dateText.toLowerCase().includes('dimanche') || dateText.toLowerCase().includes('dim')) {
                            isSunday = true;
                        }
                    }

                    if (isManualRejected) {
                        const rejectBtn = row.querySelector('input[src*="croix_supprime"], img[src*="croix_supprime"], a[title*="Refuser"]');
                        if (rejectBtn) {
                            try {
                                if (rejectBtn.tagName === 'IMG' && rejectBtn.parentElement && rejectBtn.parentElement.tagName === 'A') {
                                    rejectBtn.parentElement.click();
                                } else {
                                    (rejectBtn as HTMLElement).click();
                                }
                            } catch (e) { }
                            result.isRejected = true;
                            break;
                        }
                    } else if (isVIP || isManualTriggered) {
                        if (isSunday && !isManualTriggered) {
                            if (!alertedIds.includes(result.num)) {
                                result.foundSunday = true;
                                break;
                            }
                        } else {
                            try {
                                if (acceptBtn.tagName === 'IMG' && acceptBtn.parentElement && acceptBtn.parentElement.tagName === 'A') {
                                    acceptBtn.parentElement.click();
                                } else {
                                    (acceptBtn as HTMLElement).click();
                                }
                            } catch (e) { }
                            result.clicked = true;
                            result.isManual = isManualTriggered;
                            break;
                        }
                    } else {
                        // C'est pas VIP
                        // On signale si on ne l'a pas déjà fait
                        if (!alertedIds.includes(result.num)) {
                            result.foundNotVip = true;
                            break;
                        }
                    }
                }
            }
        }
        return result;
    }, { manualIds: manualClicksArray, alertedIds: alertedCoursesArray, manualRejectIds: manualRejectsArray, withFilters });

    if (extraction.isManual) {
        manualClicks.delete(extraction.num); // Reset memory
    }

    if (extraction.isRejected) {
        manualRejects.delete(extraction.num);
    }

    // Gérer les clics manuels sur des courses qui ont disparues (Trop tard !)
    for (const mId of manualClicksArray) {
        if (!extraction.allNums.includes(mId)) {
            console.log(`❌ Course manuelle ${mId} disparue du DOM !`);
            await sendTelegramAlert(`❌ **TROP TARD !**\nLa course n°${mId} a disparu de la plateforme entre ton clic et la vérification. Quelqu'un d'autre l'a prise.`);
            manualClicks.delete(mId);
            await saveLog("FAILED_ALREADY_TAKEN", null, "Disparue", "Disparue", mId);
        }
    }

    // Gérer les refus manuels sur des courses disparues
    for (const mId of manualRejectsArray) {
        if (!extraction.allNums.includes(mId)) {
            console.log(`❌ Course refusée manuellement ${mId} disparue du DOM !`);
            manualRejects.delete(mId);
        }
    }

    if (extraction.isRejected) {
        try {
            console.log(`⏳ Remplissage du motif de refus pour la course ${extraction.num}...`);
            await page.waitForTimeout(1000); // Wait for the modal to pop up

            // Gérer la boîte de dialogue (Popup DOM)
            await page.evaluate(() => {
                // 1. Renseigner le motif dans la liste déroulante (select) si elle existe
                const selects = document.querySelectorAll('select');
                for (let i = 0; i < selects.length; i++) {
                    const sel = selects[i] as HTMLSelectElement;
                    if (sel.options.length > 1 && sel.offsetParent !== null) { // Si visible
                        sel.selectedIndex = 1; // Par défaut le 1er motif
                        for (let j = 0; j < sel.options.length; j++) {
                            const optionText = sel.options[j].text.toLowerCase();
                            if (optionText.includes('hors secteur') || optionText.includes('indisponible') || optionText.includes('pas de véhicule')) {
                                sel.selectedIndex = j;
                                break;
                            }
                        }
                        sel.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }

                // 2. Renseigner un texte libre si besoin
                const textareas = document.querySelectorAll('textarea');
                for (let i = 0; i < textareas.length; i++) {
                    const ta = textareas[i] as HTMLTextAreaElement;
                    if (ta.offsetParent !== null) {
                        ta.value = "Hors secteur / Refus manuel Telegram";
                        ta.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }

                // 3. Chercher et Cliquer sur le bouton "Valider"
                const buttons = document.querySelectorAll('button, input[type="button"], input[type="submit"], .btn, a');
                for (let i = 0; i < buttons.length; i++) {
                    const btn = buttons[i] as HTMLElement;
                    const text = (btn.innerText || btn.getAttribute('value') || "").toLowerCase().trim();
                    if (btn.offsetParent !== null && (text === 'valider' || text.includes('valider'))) {
                        btn.click();
                        break;
                    }
                }
            });

            console.log(`✅ Motif renseigné et "Valider" cliqué.`);
            await page.waitForTimeout(2000); // Laisse le temps à l'Ajax de supprimer la ligne
            await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 5000 }).catch(() => { });
        } catch (e) {
            console.error(`❌ Erreur lors du clic sur Valider :`, e);
        }

        const finalBuffer = await page.screenshot({ fullPage: true }) as Buffer;
        return { buffer: finalBuffer, status: "REJECTED_SUCCESS", num: extraction.num, depart: extraction.departText, arrivee: extraction.arriveeText, demandeur: extraction.demandeurText };
    }

    if (!extraction.clicked) {
        if (extraction.foundSunday) {
            alertedCourses.add(extraction.num); // Ne pas spammer
            const buffer = await page.screenshot({ fullPage: true }) as Buffer;
            return { buffer, status: "ignored_sunday", num: extraction.num, depart: extraction.departText, arrivee: extraction.arriveeText, demandeur: extraction.demandeurText };
        }
        if (extraction.foundNotVip) {
            alertedCourses.add(extraction.num); // Ne pas spammer à la prochaine boucle
            const buffer = await page.screenshot({ fullPage: true }) as Buffer;
            return { buffer, status: "ignored_not_vip", num: extraction.num, depart: extraction.departText, arrivee: extraction.arriveeText };
        }
        return { buffer: null, status: "ignored" };
    }

    console.log("⚡ Clic sur la course effectué ! En attente de la navigation ou du pop-up...");

    // Si la page fait une navigation complète (PostBack au lieu de Ajax), on l'attend
    try { await page.waitForLoadState('networkidle', { timeout: 1500 }); } catch (e) { }

    let validationClicked = false;
    let attempts = 0;
    while (attempts < 5) {
        attempts++;
        try {
            await new Promise(r => setTimeout(r, 400)); // Laisse le temps au nouveau DOM/Popup de pop

            // Étape 3: Analyser la page, lire l'heure voulue, et remplir les champs
            validationClicked = await page.evaluate(() => {
                const bodyText = document.body.innerText;

                // Extract Date from RDV (e.g. "RDV le 03/04/2026")
                const rdvDateMatch = bodyText.match(/RDV\s+le\s+(\d{2}\/\d{2}\/\d{4})/i) || bodyText.match(/(\d{2}\/\d{2}\/\d{4})/i);
                let targetDate = rdvDateMatch ? rdvDateMatch[1] : "";

                // Extract Time from "Heure de départ souhaitée par l'établissement : 00:00"
                const timeMatch = bodyText.match(/souhait[eé]e.*?(?:l'établissement|)[:\s]*(\d{2}:\d{2})/i) || bodyText.match(/à\s*(\d{2}:\d{2})/i);
                let targetTime = timeMatch ? timeMatch[1] : "12:00";

                let dateInput = document.getElementById('ctl00_ContentPlaceHolder1_TBDate') as HTMLInputElement;
                let timeInput = document.getElementById('ctl00_ContentPlaceHolder1_TBHeureRecuperation') as HTMLInputElement;
                let chauffeurSel = document.getElementById('ctl00_ContentPlaceHolder1_DDLChauffeur') as HTMLSelectElement;
                let equipierSel = document.getElementById('ctl00_ContentPlaceHolder1_DDLEquipier') as HTMLSelectElement;

                if (dateInput && targetDate) {
                    (dateInput as HTMLInputElement).value = targetDate;
                    dateInput.dispatchEvent(new Event('input', { bubbles: true }));
                    dateInput.dispatchEvent(new Event('change', { bubbles: true }));
                }

                if (timeInput && targetTime) {
                    (timeInput as HTMLInputElement).value = targetTime;
                    timeInput.dispatchEvent(new Event('input', { bubbles: true }));
                    timeInput.dispatchEvent(new Event('change', { bubbles: true }));
                }

                if (chauffeurSel && chauffeurSel instanceof HTMLSelectElement) {
                    for (let i = 0; i < chauffeurSel.options.length; i++) {
                        if (chauffeurSel.options[i].text.toLowerCase().includes('cheikh hamid')) {
                            chauffeurSel.selectedIndex = i;
                            chauffeurSel.value = chauffeurSel.options[i].value;
                            chauffeurSel.dispatchEvent(new Event('change', { bubbles: true }));
                            break;
                        }
                    }
                }

                if (equipierSel && equipierSel instanceof HTMLSelectElement) {
                    for (let i = 0; i < equipierSel.options.length; i++) {
                        if (equipierSel.options[i].text.toLowerCase().includes('cheikh hamid')) {
                            equipierSel.selectedIndex = i;
                            equipierSel.value = equipierSel.options[i].value;
                            equipierSel.dispatchEvent(new Event('change', { bubbles: true }));
                            break;
                        }
                    }
                }

                let submitBtn = document.querySelector('#ctl00_ContentPlaceHolder1_BtnValider') || document.querySelector('input[src*="valide"], input[src*="check"], img[src*="valide"], img[src*="check"], a[title*="accepter"], .fa-check, img[src*="V_Vert"]');

                if (submitBtn) {
                    try {
                        // @ts-ignore
                        if (submitBtn.tagName === 'A' && typeof __doPostBack === 'function' && submitBtn.id) {
                            // @ts-ignore
                            __doPostBack(submitBtn.id.replace(/_/g, '$'), '');
                        } else {
                            (submitBtn as HTMLElement).click();
                        }
                    } catch (e) { }
                    return true;
                }
                return false;
            });

            // Si on arrive ici, l'évaluation a réussi sans crash, on stoppe le retry
            break;
        } catch (e: any) {
            if (e.message?.includes("Execution context was destroyed") || e.message?.includes("Target closed")) {
                console.log(`⚠️ Navigation contextuelle interceptée (Tentative ${attempts}/5)...`);
                await new Promise(r => setTimeout(r, 1000));
            } else {
                throw e;
            }
        }
    }

    if (validationClicked) {
        try {
            console.log("⏳ Attente de la validation (Navigation/PostBack)...");
            await Promise.all([
                page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 6000 }),
                new Promise(r => setTimeout(r, 300)) // Force delay minimal de survie du submit HTTP
            ]);
        } catch (e) {
            console.log("⚠️ Aucune navigation détectée. Utilisation du délai de secours.");
            await new Promise(r => setTimeout(r, 4000));
        }
    }

    // --- ÉTAPE 4 : Vérifier s'il y a l'erreur ---
    const finalBuffer = await page.screenshot({ fullPage: true }) as Buffer;
    const isError = await page.evaluate(() => document.body.innerText.includes("déjà acceptée"));

    if (isError) {
        return { buffer: finalBuffer, status: "failed_already_taken", num: extraction.num, depart: extraction.departText, arrivee: extraction.arriveeText, demandeur: extraction.demandeurText };
    }
    return { buffer: finalBuffer, status: extraction.isManual ? "MANUAL_SUCCESS" : "SUCCESS", num: extraction.num, depart: extraction.departText, arrivee: extraction.arriveeText, demandeur: extraction.demandeurText };
}

async function startAgent() {
    console.log("🚀 Lancement de l'Agent AMC (Espion & Sniper Interactif)...")

    while (true) {
        if (isBotDisconnected) {
            await new Promise(r => setTimeout(r, 5000));
            continue;
        }

        let browser = null
        try {
            browser = await chromium.launch({
                headless: true,
                args: ["--no-sandbox", "--disable-setuid-sandbox"],
            })
            const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
            const page = await context.newPage()
            act_page = page;

            console.log("📡 Accès à la page cible...")
            await page.goto(AMC_URL, { waitUntil: "networkidle" })

            let proofSent = false;

            let redirectionCount = 0;

            console.log("⏳ Début de la boucle de surveillance (15s)...")
            while (true) {
                if (page.isClosed()) {
                    if (isBotDisconnected) {
                        console.log("✅ Fermeture interceptée pendant le repos.");
                    }
                    throw new Error("Target closed manually");
                }

                if (isBotPaused) {
                    await new Promise(r => setTimeout(r, 8000));
                    continue;
                }

                // --- PAUSE MATINALE CRITIQUE (05:30 -> 07:00) ---
                const now = new Date();
                // Ajustement auto sur l'heure locale VPS (qui devrait être sur Europe/Paris), sinon prévoir un offset
                const hours = now.getHours();
                const mins = now.getMinutes();
                const isMorningPause = (hours === 5 && mins >= 30) || (hours === 6) || (hours === 7 && mins === 0);
                if (isMorningPause) {
                    console.log(`[${now.toLocaleTimeString()}] ☕ PAUSE MATINALE OBLIGATOIRE (05:30 - 07:00). Le robot se met en veille 1 minute...`);
                    await new Promise(r => setTimeout(r, 60000));
                    continue;
                }

                // --- CRON ALERT 20H00 (Rappel de Prise de Service) ---
                let isCronAlertSentToday = (global as any).lastCronSentDay === now.getDate();
                if (!isCronAlertSentToday && hours === 20 && mins < 5) {
                    (global as any).lastCronSentDay = now.getDate();
                    console.log(`[${now.toLocaleTimeString()}] ⏰ DÉCLENCHEMENT DU CRON 20H00 (WebPush Alert)...`);
                    try {
                        fetch('http://localhost:8080/api/cron/validate-alert', { method: 'POST' })
                            .then(r => r.json())
                            .then(data => console.log(`[CRON RESULT]`, data))
                            .catch(e => console.error(`[CRON ERROR]`, e));
                    } catch (e) { }
                }

                let pageText = "";
                try {
                    pageText = await page.evaluate(() => document.body.innerText);
                } catch (e: any) {
                    if (isBotDisconnected || (e.message && e.message.includes("Target closed"))) {
                        throw e; // Laisse l'erreur remonter au catch global pour fermer et hiberner
                    }
                    console.log("⚠️ Navigation en cours gérée silencieusement...");
                    await new Promise(r => setTimeout(r, 2000));
                    continue;
                }

                if (pageText.includes("Mot de passe :") || pageText.includes("Se connecter")) {
                    console.log("🔒 Page de login détectée, authentification en cours...")
                    await new Promise(r => setTimeout(r, 3000))

                    // 1. Target avec les IDs EXACTS récupérés via ta photo DOM inspectée
                    const identifierInput = await page.$('input[id*="Login"]');
                    const passwordInput = await page.$('input[id*="Password"]');
                    const submitButton = await page.$('a[id*="ValiderButton"]');

                    if (identifierInput && passwordInput && submitButton) {
                        console.log(`Clavier magique (IDs Exacts)... User=${AMC_USERNAME}`);

                        await identifierInput.click({ clickCount: 3 });
                        await page.keyboard.press('Backspace');
                        await identifierInput.type(AMC_USERNAME, { delay: 100 });

                        await passwordInput.click({ clickCount: 3 });
                        await page.keyboard.press('Backspace');
                        await passwordInput.type(AMC_PASSWORD, { delay: 100 });

                        await new Promise(r => setTimeout(r, 1000));
                        console.log("Clic asynchrone sur le vrai bouton a#ctl00_ValiderButton...");

                        try {
                            await submitButton.evaluate((b: any) => b.click());
                            await page.waitForLoadState("networkidle", { timeout: 20000 });
                        } catch (e) { }
                    } else {
                        console.log("❌ ERREUR CATACLYSMIQUE : Impossible de localiser les IDs ctl00_Login, ctl00_Password ou ctl00_ValiderButton !");
                    }

                    await new Promise(r => setTimeout(r, 5000));
                    continue
                }

                if (!page.url().includes("TransporteurAtraiter")) {
                    redirectionCount++;
                    console.log(`⚠️ Redirection temporaire détectée (${page.url()})... (${redirectionCount}/3)`);
                    
                    if (redirectionCount > 3) {
                        console.log("❌ Bloqué en redirection (Écran blanc/Timeout). Crash intentionnel pour forcer une reconnexion immédiate !");
                        await sendTelegramAlert("⚠️ **ALERTE AUTO-RÉPARATION**\nLe robot s'est retrouvé bloqué sur une page blanche. Je redémarre instantanément mon système depuis zéro !");
                        throw new Error("Redirection loop detected, forcing PM2 restart");
                    }
                    
                    try {
                        await page.goto(AMC_URL, { waitUntil: "networkidle", timeout: 10000 });
                    } catch(e) {}
                    
                    await new Promise(r => setTimeout(r, 5000));
                    continue;
                } else {
                    redirectionCount = 0;
                }

                let hasRienAtraiter = true;
                for (let attempts = 1; attempts <= 5; attempts++) {
                    try {
                        hasRienAtraiter = await page.evaluate(() => {
                            const spanCompteur = document.querySelector('#ctl00_ContentPlaceHolder1_LabAAffecter') as HTMLElement;
                            if (spanCompteur && !isNaN(parseInt(spanCompteur.innerText))) {
                                if (parseInt(spanCompteur.innerText) > 0) return false;
                            }

                            const atTable = document.querySelector('#AT_Affectation');
                            if (!atTable) return true;
                            const validationButtons = atTable.querySelectorAll('input[src*="valide"], input[src*="check"], img[src*="valide"], img[src*="check"], .fa-check, a[title*="accepter"]');
                            return validationButtons.length === 0;
                        });
                        break;
                    } catch (e: any) {
                        if (e.message?.includes("Execution context was destroyed") || e.message?.includes("Target closed")) {
                            console.log(`⚠️ Navigation en cours détectée (Tentative ${attempts}/5)... Attente du nouveau contexte.`);
                            await new Promise(r => setTimeout(r, 1000));
                        } else {
                            throw e;
                        }
                    }
                }

                if (!proofSent && page.url().includes("TransporteurAtraiter")) {
                    console.log("📸 Prise de la capture de preuve de connexion...")
                    const proofBuffer = await page.screenshot({ fullPage: true }) as Buffer
                    await sendTelegramAlert("📸 **PREUVE DE CONNEXION**\nL'Agent est bien à l'intérieur ! Voici le tableau de chasse vide que je surveille :", proofBuffer)
                    proofSent = true;
                }

                if (hasRienAtraiter && manualClicks.size > 0) {
                    // Si le tableau est vide mais qu'on a cliqué sur un bouton Telegram en retard
                    for (const mId of Array.from(manualClicks)) {
                        await sendTelegramAlert(`❌ **TROP TARD !**\nTa demande pour la course n°${mId} est arrivée, mais le tableau est complètement vide actuellement.`);
                        manualClicks.delete(mId);
                        await saveLog("FAILED_ALREADY_TAKEN", null, "Disparue (Vide)", "Disparue (Vide)", mId);
                    }
                }

                // --- NOUVEAU : SYNC DU TABLEAU "DEMANDES ACCEPTEES" ---
                try {
                    const evalResult = await page.evaluate((syncedIds: string[]) => {
                        let results: any[] = [];
                        let debugInfo = "Init;";

                        const allTables = Array.from(document.querySelectorAll('table'));
                        debugInfo += ` Tables_On_Page:${allTables.length};`;

                        const acceptedTable = allTables.find(t => t.innerText && (t.innerText.includes('Demandes acceptées') || t.innerText.includes('Acceptées')));

                        if (acceptedTable) {
                            debugInfo += " Table_Found;";
                            const rows = acceptedTable.querySelectorAll('tr');
                            debugInfo += ` Rows:${rows.length};`;

                            for (let row of rows) {
                                const tds = row.querySelectorAll('td');
                                if (tds.length >= 8) {
                                    const td0 = tds[0].innerText.trim();
                                    const numMatch = td0.match(/[0-9]{6,7}/);

                                    if (numMatch || parseInt(td0) > 100000) {
                                        const num = numMatch ? numMatch[0] : td0;
                                        if (!syncedIds.includes(num)) {
                                            const demandeurText = tds[1] ? tds[1].innerText.replace(/\n/g, ' ').trim() : "";
                                            const departText = tds[2] ? tds[2].innerText.replace(/\n/g, ' ').trim() : "Inconnu";
                                            const patientText = tds[3] ? tds[3].innerText.replace(/\n/g, ' ').trim() : "";
                                            const arriveeText = tds[6] ? tds[6].innerText.replace(/\n/g, ' ').trim() : "Inconnu";
                                            const dateText = tds[7] ? tds[7].innerText.trim() : "";
                                            let heureText = tds[8] ? tds[8].innerText.trim() : "";
                                            if (heureText.includes(' ')) heureText = heureText.split(' ')[1]; // Extraction de l'heure

                                            results.push({
                                                num,
                                                demandeur: demandeurText,
                                                patient: patientText,
                                                depart: departText,
                                                arrivee: arriveeText,
                                                datePec: dateText,
                                                heurePec: heureText
                                            });
                                        }
                                    }
                                }
                            }
                        } else {
                            debugInfo += " NO_ACCEPTED_TABLE_FOUND;";
                        }
                        return { results, debugInfo };
                    }, Array.from(syncedAcceptedCourses));

                    const newHistory = evalResult.results;
                    console.log(`🔥 [DEBUG V2] Info interne historique : ${evalResult.debugInfo}`);

                    if (newHistory.length > 0) {
                        console.log(`📌 Nouvel historique détecté : ${newHistory.length} course(s)... historisation en cours !`);
                        const acceptedBuffer = await page.screenshot({ fullPage: true }) as Buffer;
                        for (let hist of newHistory) {
                            syncedAcceptedCourses.add(hist.num);
                            
                            // NOUVEAU: Récupérer le "Choix Ambulance par patient" silencieusement
                            let patientChoice = undefined;
                            try {
                                patientChoice = await page.evaluate(async (courseNum: string) => {
                                    try {
                                        const res = await fetch(`ImpDemande.aspx?IDDemande=${courseNum}`);
                                        const html = await res.text();
                                        // Cherche la balise <span>non</span> ou <span>oui</span>
                                        const parser = new DOMParser();
                                        const doc = parser.parseFromString(html, "text/html");
                                        const span = doc.getElementById('ctl00_ContentPlaceHolder1_LabChoixAmbuPatient');
                                        if (span) {
                                            return span.innerText.trim().toLowerCase() === 'oui';
                                        }
                                        return false;
                                    } catch (e) {
                                        return false;
                                    }
                                }, hist.num);
                                console.log(`-> Info PatientChoice pour ${hist.num}: ${patientChoice ? 'OUI' : 'NON'}`);
                            } catch (e) {}

                            console.log(`-> Push de la course history ${hist.num} (${hist.depart} -> ${hist.arrivee})`);
                            await saveLog("MANUAL_SUCCESS", acceptedBuffer, hist.depart, hist.arrivee, hist.num, hist.demandeur, hist.patient, hist.datePec, hist.heurePec, patientChoice);
                        }
                    }
                } catch (err) {
                    console.error("❌ Erreur pendant le sync de l'historique :", err);
                }
                // --------------------------------------------------------

                if (!hasRienAtraiter) {
                    console.log("🚨 ACTIVITÉ DÉTECTÉE SUR LE PRT !!")

                    // Nouvelle logique : Screenshot TOUTE activité nouvelle (uniquement les courses non acceptées)
                    try {
                        const currentNums = await page.evaluate(() => {
                            const targetTable = document.querySelector('#AT_Affectation') || document;
                            const theadRows = targetTable.querySelectorAll('thead tr');
                            const headerTr = theadRows.length > 1 ? theadRows[1] : (theadRows[0] || targetTable);
                            const headers = Array.from(headerTr.querySelectorAll('th'));
                            const nIdx = headers.findIndex((th: any) => (th.innerText || "").trim().toLowerCase() === 'n°');

                            return Array.from(targetTable.querySelectorAll('tr'))
                                .filter((tr: any) => tr.querySelector('input[src*="valide"], input[src*="check"], img[src*="valide"], img[src*="check"], a[title*="accepter"], .fa-check, img[src*="V_Vert"]') !== null)
                                .map((tr: any) => {
                                    const tds = tr.querySelectorAll('td');
                                    if (nIdx >= 0 && tds.length > nIdx) return tds[nIdx].innerText.trim();
                                    return null;
                                })
                                .filter(n => n);
                        });
                        const newNums = (currentNums as string[]).filter(n => !activityMemory.has(n));
                        if (newNums.length > 0) {
                            const snapBuffer = await page.screenshot({ fullPage: true }) as Buffer;
                            await sendTelegramAlert(`👀 **MOUVEMENT DÉTECTÉ !**\nDe nouvelles demandes viennent d'apparaître sur le tableau. Évaluation en cours...`, snapBuffer);
                            newNums.forEach(n => activityMemory.add(n));
                        }
                    } catch (e) { }

                    const snipeResult = await snipeCourse(page, isFilterActive);

                    if (snipeResult.status === "ignored") {
                        console.log("⏭️ Les courses ne matchent pas. Évaluation en boucle (2s)...");
                        await new Promise(r => setTimeout(r, 2000));
                    }
                    else if (snipeResult.status === "ignored_sunday") {
                        console.log("⚠️ Course VIP DU DIMANCHE trouvée. Envoi du screenshot interactif Telegram.");
                        if (snipeResult.buffer) {
                            await sendTelegramAlert(
                                `⚠️ **COURSE DU DIMANCHE ! (Dép: ${snipeResult.depart} -> Arr: ${snipeResult.arrivee})**\nCette course remplit nos conditions VIP, mais elle est prévue un **DIMANCHE**.\nDoit-on l'accepter ?`,
                                snipeResult.buffer,
                                snipeResult.num
                            );
                            await saveLog("MANUAL_PENDING", snipeResult.buffer, snipeResult.depart || "Inconnu", snipeResult.arrivee || "Inconnu", snipeResult.num || "Inconnu", snipeResult.demandeur);
                        }
                        await new Promise(r => setTimeout(r, 2000));
                    }
                    else if (snipeResult.status === "ignored_not_vip") {
                        console.log("⚠️ Course HORS VIP trouvée. Envoi du screenshot interactif Telegram.");
                        if (snipeResult.buffer) {
                            await sendTelegramAlert(
                                `⚠️ **COURSE HORS SECTEUR (Dép: ${snipeResult.depart} -> Arr: ${snipeResult.arrivee})**\nUne course a été détectée mais ne remplit pas les conditions VIP strictes.\nVeux-tu la forcer ?`,
                                snipeResult.buffer,
                                snipeResult.num
                            );
                            // On logue en attente (MANUAL_PENDING)
                            await saveLog("MANUAL_PENDING", snipeResult.buffer, snipeResult.depart || "Inconnu", snipeResult.arrivee || "Inconnu", snipeResult.num || "Inconnu", snipeResult.demandeur);
                        }
                        await new Promise(r => setTimeout(r, 2000));
                    }
                    else if (snipeResult.status === "failed_already_taken") {
                        console.log("❌ ÉCHEC : Course prise par quelqu'un de plus rapide. Enregistrement de l'échec et log...");
                        await sendTelegramAlert("❌ **TROP LENT ! ÉCHEC !**\nLe robot a cliqué et soumis le formulaire, mais quelqu'un d'autre l'avait déjà piquée juste avant.\n*La course a filé.*", snipeResult.buffer || undefined);
                        await saveLog("FAILED_ALREADY_TAKEN", snipeResult.buffer, snipeResult.depart || "Inconnu", snipeResult.arrivee || "Inconnu", snipeResult.num || "Inconnu", snipeResult.demandeur);
                        await page.goto(AMC_URL, { waitUntil: "networkidle" });
                        await new Promise(r => setTimeout(r, 8000));
                    }
                    else if (snipeResult.status === "SUCCESS") {
                        if (snipeResult.buffer) {
                            await sendTelegramAlert("🎯 **MISSION ACCOMPLIE ! COURSE SNIPÉE (AUTO) !** 🚑💨\n- Heure PEC ajustée dynamiquement\n- VDF1 assigné (Chauffeur)\n- VDF2 assigné (Équipier)\nLa demande est à nous !", snipeResult.buffer);
                            await saveLog("SUCCESS", snipeResult.buffer, snipeResult.depart || "Inconnu", snipeResult.arrivee || "Inconnu", snipeResult.num || "Inconnu");
                        }
                        await new Promise(r => setTimeout(r, 120000));
                    }
                    else if (snipeResult.status === "MANUAL_SUCCESS") {
                        if (snipeResult.buffer) {
                            await sendTelegramAlert("🎯 **COURSE VALIDÉE MANUELLEMENT AVEC SUCCÈS !** 🚑💨\nC'est dans la poche !", snipeResult.buffer);
                            await saveLog("MANUAL_SUCCESS", snipeResult.buffer, snipeResult.depart || "Inconnu", snipeResult.arrivee || "Inconnu", snipeResult.num || "Inconnu");
                        }
                        await new Promise(r => setTimeout(r, 120000));
                    }
                    else if (snipeResult.status === "REJECTED_SUCCESS") {
                        if (snipeResult.buffer) {
                            await sendTelegramAlert("🗑️ **COURSE REFUSÉE MANUELLEMENT !**\nElle a été supprimée définitivement.", snipeResult.buffer);
                        }
                        await new Promise(r => setTimeout(r, 2000));
                    }
                    else {
                        if (snipeResult.buffer) await sendTelegramAlert("⚠️ **COMPORTEMENT IMPRÉVU PENDANT LE SNIPING...**", snipeResult.buffer);
                        await new Promise(r => setTimeout(r, 30000));
                    }
                } else {
                    const randomDelay = Math.floor(Math.random() * (20000 - 12000 + 1) + 12000)
                    console.log(`[Surveillance Temps Réel] En écoute active du DOM pendant ${Math.floor(randomDelay / 1000)}s (sans recharger)...`)

                    try {
                        // Event-Driven: Playwright attend la milli-seconde où le bouton accpeter apparaît.
                        await page.waitForSelector('#AT_Affectation tbody tr input[src*="valide"], #AT_Affectation tbody tr input[src*="check"], #AT_Affectation tbody tr img[src*="valide"], #AT_Affectation tbody tr .fa-check, #AT_Affectation tbody tr a[title*="accepter"]', { state: 'attached', timeout: randomDelay });
                        console.log("⚡ [EVENT] Apparition soudaine d'une course détectée ! Action immédiate !");
                        continue;
                    } catch (e) {
                        console.log(`[${new Date().toLocaleTimeString()}] Fin de l'écoute active. Rafraîchissement de la page...`)
                        try {
                            await page.reload({ waitUntil: "domcontentloaded" })
                        } catch (e) { }
                    }
                }
            }

        } catch (error) {
            if (isBotDisconnected) {
                console.log("✅ Déconnexion volontaire accomplie, silence radio.");
                if (browser) { try { await browser.close() } catch (e) { } }
                continue;
            }
            console.error("❌ ERREUR FATALE (Redémarrage dans 15s):", error)
            let crashBuffer = null;
            try {
                if (browser) {
                    const contexts = browser.contexts();
                    if (contexts.length > 0) {
                        const pages = contexts[0].pages();
                        if (pages.length > 0) crashBuffer = await pages[0].screenshot({ fullPage: true }) as Buffer;
                    }
                }
            } catch (e) { }

            if (crashBuffer) {
                await sendTelegramAlert(`🔄 **CRASH RELAYÉ - REDÉMARRAGE AUTOMATIQUE** :\n\`${error}\`\n\n📸 **TRACE DU TABLEAU AVANT LE CRASH :**`, crashBuffer)
            } else {
                await sendTelegramAlert(`🔄 **CRASH RELAYÉ - REDÉMARRAGE AUTOMATIQUE** :\n\`${error}\``)
            }

            if (browser) {
                try { await browser.close() } catch (e) { }
            }
            await new Promise(r => setTimeout(r, 15000))
        }
    }
}

startAgent()

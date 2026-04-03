import puppeteer from "puppeteer"
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
            [{ text: "✅ Mode: AVEC Villes" }, { text: "⚠️ Mode: TOUT PRENDRE" }],
            [{ text: "📸 Capture d'écran" }, { text: "🔌 Déconnexion" }]
        ],
        resize_keyboard: true,
        is_persistent: true
    }
};

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text || "";
    console.log(`[TELEGRAM RADAR] Message reçu de ${msg.from?.first_name || 'Inconnu'} (ID: ${chatId}): ${text}`);
    
    if (text === '/stop' || text.includes('Pause')) { 
        isBotPaused = true; 
        bot.sendMessage(chatId, '🛑 **Robot mis en pause.** \n\n*Que se passe-t-il ?*\nLe robot reste connecté sur la page AMC de VDF, mais il se met dans un coin et arrête de cliquer sur "Rechercher". Il laisse l\'utilisateur manipuler le site sans le déconnecter. \n\nPour reprendre le sniping, clique sur Démarrer.', {parse_mode: 'Markdown', ...botKeyboard}); 
        return; 
    }
    
    if (text === '/run' || text.includes('Démarrer')) { 
        isBotPaused = false; 
        if (isBotDisconnected) {
            isBotDisconnected = false;
            bot.sendMessage(chatId, '▶️ **Robot réactivé après Déconnexion.** \n\nJe lance le navigateur et me reconnecte au site AMC de zéro !', {parse_mode: 'Markdown', ...botKeyboard}); 
            return;
        }
        bot.sendMessage(chatId, '▶️ **Robot réactivé (Sniper ON).** \n\nJe reprends mon rôle de Sniper, je retourne cliquer sur le bouton de rafraîchissement au moindre nouveau radar !', {parse_mode: 'Markdown', ...botKeyboard}); 
        return; 
    }

    if (text.includes('TOUT PRENDRE')) {
        isFilterActive = false;
        bot.sendMessage(chatId, "⚠️ **MODE SANS CONDITION ACTIVÉ !**\n\nLe robot va sniper absolument TOUTES LES COURSES qui apparaissent sur l'écran (sans vérifier Gonesse, Paris, ou Province).\n\nPour réactiver la sécurité, utilise le bouton *✅ Mode: AVEC Villes*.", {parse_mode: 'Markdown'});
        return;
    }
    
    if (text.includes('AVEC Villes')) {
        isFilterActive = true;
        bot.sendMessage(chatId, "✅ **MODE SÉCURISÉ ACTIVÉ !**\n\nLe robot redevient sélectif. Il ne prendra QUE les courses au départ de Gonesse (GHT) vers les villes autorisées (Goussainville, Villiers, etc.)", {parse_mode: 'Markdown'});
        return;
    }

    if (text.includes('Capture')) {
        if (act_page) {
            bot.sendMessage(chatId, "📸 *Prise de vue en cours, patiente une seconde...*", {parse_mode: 'Markdown'});
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
        bot.sendMessage(chatId, "🔌 **Déconnexion totale accomplie.**\n\nLe robot AMC a fermé sa connexion internet. Le compte t'est rendu. Il restera profondément endormi jusqu'à ce que tu cliques sur **▶️ Démarrer**.", {parse_mode: 'Markdown'});
        if (act_page) {
            try { await act_page.close(); } catch(e) {}
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
        console.log(`[TELEGRAM] Demande manuelle reçue pour sniper la course ${courseId} !`)
        
        bot.answerCallbackQuery(query.id, { text: "✅ Ordre reçu ! Dès le prochain balayage (15s max), je l'attrape s'il est encore là ! 🚀", show_alert: true })
        
        if (query.message) {
            bot.editMessageReplyMarkup({ inline_keyboard: [[{ text: `⏳ En cours de sniper pour la course ${courseId}...`, callback_data: 'WAIT' }]] }, { chat_id: query.message.chat.id, message_id: query.message.message_id })
        }
    }
})

async function saveLog(status: string, screenshotBuffer: Buffer | null, depart: string, arrivee: string, num: string, demandeur: string = "", patient: string = "", datePec: string = "", heurePec: string = "") {
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
    } catch(e) {
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
                  inline_keyboard: [[{ text: "✅ Accepter MANUELLEMENT", callback_data: `ACCEPT_${courseId}` }]]
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

async function snipeCourse(page: any, withFilters: boolean = true): Promise<{ buffer: Buffer | null, status: string, num?: string, depart?: string, arrivee?: string }> {
    console.log("🎯 DÉBUT DU SNIPING ! Évaluation Chirurgicale des courses...")
    const manualClicksArray = Array.from(manualClicks);
    const alertedCoursesArray = Array.from(alertedCourses);
    
    // Étape 1: Évaluer les lignes du tableau et filtrer
    const extraction = await page.evaluate((manualIds: string[], alertedIds: string[], withFilters: boolean) => {
        const allowedZipCodes = [
            "95500", "95400", "95200", "95140", "95380", 
            "95190", "95470", "95270", "95700", "95440", 
            "95350", "95670", "95720", "95570", "95850", 
            "93290", "93440"
        ];
        
        let result = { clicked: false, isManual: false, num: "", departText: "", arriveeText: "", foundNotVip: false, allNums: [] as string[] };
        
        const targetTable = document.querySelector('#AT_Affectation') || document;
        const headers = Array.from(targetTable.querySelectorAll('th'));
        const departIdx = headers.findIndex(th => (th.innerText || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes('depart'));
        const arriveeIdx = headers.findIndex(th => (th.innerText || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes('arrive'));
        const nIdx = headers.findIndex(th => (th.innerText || "").toLowerCase() === 'n°');
        
        const rows = targetTable.querySelectorAll('tr');
        for (let row of rows) {
            const acceptBtn = row.querySelector('input[type="image"][src*="valider"], img[src*="valider"], img[src*="check"], a[title*="accepter"]');
            
            if (acceptBtn && departIdx >= 0 && arriveeIdx >= 0 && nIdx >= 0) {
                const tds = row.querySelectorAll('td');
                if (tds.length > Math.max(departIdx, arriveeIdx, nIdx)) {
                    result.departText = tds[departIdx].innerText.trim();
                    result.arriveeText = tds[arriveeIdx].innerText.trim();
                    result.num = tds[nIdx].innerText.trim();
                    result.allNums.push(result.num);
                    
                    const isGonesseDepart = result.departText.toLowerCase().includes('gonesse') || result.departText.includes('95500');
                    const isAllowedArrivee = allowedZipCodes.some(zip => result.arriveeText.includes(zip));
                    
                    const isVIP = withFilters ? (isGonesseDepart && isAllowedArrivee) : true;
                    const isManualTriggered = manualIds.includes(result.num);

                    if (isVIP || isManualTriggered) {
                        setTimeout(() => {
                            if (acceptBtn.tagName === 'IMG' && acceptBtn.parentElement && acceptBtn.parentElement.tagName === 'A') {
                                acceptBtn.parentElement.click();
                            } else {
                                (acceptBtn as HTMLElement).click();
                            }
                        }, 100);
                        result.clicked = true;
                        result.isManual = isManualTriggered;
                        break; 
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
    }, manualClicksArray, alertedCoursesArray, withFilters);

    if (extraction.isManual) {
        manualClicks.delete(extraction.num); // Reset memory
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

    if (!extraction.clicked) {
        if (extraction.foundNotVip) {
            alertedCourses.add(extraction.num); // Ne pas spammer à la prochaine boucle
            const buffer = await page.screenshot({ fullPage: true }) as Buffer;
            return { buffer, status: "ignored_not_vip", num: extraction.num, depart: extraction.departText, arrivee: extraction.arriveeText };
        }
        return { buffer: null, status: "ignored" };
    }
    
    console.log("✅ Clic sur la course effectué ! Attente de l'ouverture du Pop-up AJAX...");
    await new Promise(r => setTimeout(r, 2000)); 
    
    // Étape 3: Analyser le pop-up, lire l'heure voulue, et remplir les champs
    const validationClicked = await page.evaluate(() => {
        const bodyText = document.body.innerText;
        
        // Ex: "RDV le 03/04/2026 à 00:15"
        const rdvMatch = bodyText.match(/RDV\s+le\s+(\d{2}\/\d{2}\/\d{4})\s+à\s+(\d{2}:\d{2})/i) 
                        || bodyText.match(/(\d{2}\/\d{2}\/\d{4}).*?(\d{2}:\d{2})/i); 
                        
        let targetDate = "";
        let targetTime = ""; 
        if (rdvMatch && rdvMatch[1] && rdvMatch[2]) {
            targetDate = rdvMatch[1];
            targetTime = rdvMatch[2];
        } else {
            // Fallbacks if RDV format is different
            const timeFallback = bodyText.match(/souhait[eé]e.*?(\d{2}:\d{2})/i) || bodyText.match(/à\s*(\d{2}:\d{2})/i);
            if (timeFallback && timeFallback[1]) targetTime = timeFallback[1];
        }

        let dateInput = null;
        let timeInput = null;
        let chauffeurSel = null;
        let equipierSel = null;

        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
        let node;
        while (node = walker.nextNode()) {
            let txt = node.nodeValue ? node.nodeValue.toLowerCase() : "";
            const parent = node.parentElement;
            if (parent && parent.getBoundingClientRect().width > 0) {
                if (!dateInput && (txt.includes('date de pec') || txt.includes('date :'))) {
                    dateInput = parent.nextElementSibling?.querySelector('input') || parent.parentElement?.querySelector('input');
                }
                if (!timeInput && (txt.includes('heure de pec') || txt.includes('heure :'))) {
                    timeInput = parent.nextElementSibling?.querySelector('input') || parent.parentElement?.querySelector('input');
                }
                if (!chauffeurSel && txt.includes('chauffeur')) {
                    chauffeurSel = parent.nextElementSibling?.querySelector('select') || parent.parentElement?.querySelector('select');
                }
                if (!equipierSel && txt.includes('equipier')) {
                    equipierSel = parent.nextElementSibling?.querySelector('select') || parent.parentElement?.querySelector('select');
                }
            }
        }
        
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
                if (chauffeurSel.options[i].text.toLowerCase().includes('ambu vdf1')) {
                    chauffeurSel.selectedIndex = i;
                    chauffeurSel.dispatchEvent(new Event('change', { bubbles: true }));
                    break;
                }
            }
        }

        if (equipierSel && equipierSel instanceof HTMLSelectElement) {
            for (let i = 0; i < equipierSel.options.length; i++) {
                if (equipierSel.options[i].text.toLowerCase().includes('ambu vdf2')) {
                    equipierSel.selectedIndex = i;
                    equipierSel.dispatchEvent(new Event('change', { bubbles: true }));
                    break;
                }
            }
        }
        
        let buttons = Array.from(document.querySelectorAll('input[type="submit"], button, a, input[type="button"]'));
        let submitBtn = buttons.find(b => {
             let text = ((b as HTMLInputElement).value || b.textContent || (b as HTMLElement).innerText || '').toLowerCase();
             let val = b.getAttribute('value') || '';
             const rect = b.getBoundingClientRect();
             return rect.width > 0 && rect.height > 0 && (text.includes('valider') || val.toLowerCase().includes('valider'));
        });
        
        if (submitBtn) {
            setTimeout(() => {
                // @ts-ignore
                if (submitBtn.tagName === 'A' && typeof __doPostBack === 'function' && submitBtn.id) {
                    // @ts-ignore
                    __doPostBack(submitBtn.id.replace(/_/g, '$'), '');
                } else {
                    (submitBtn as HTMLElement).click();
                }
            }, 100);
            return true;
        }
        return false;
    });
    
    if (validationClicked) {
        try {
            await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 8000 });
        } catch(e) {}
    } 
    
    // --- ÉTAPE 4 : Vérifier s'il y a l'erreur ---
    const finalBuffer = await page.screenshot({ fullPage: true }) as Buffer;
    const isError = await page.evaluate(() => document.body.innerText.includes("déjà acceptée"));
    
    if (isError) {
        return { buffer: finalBuffer, status: "failed_already_taken", num: extraction.num, depart: extraction.departText, arrivee: extraction.arriveeText };
    }
    return { buffer: finalBuffer, status: extraction.isManual ? "MANUAL_SUCCESS" : "SUCCESS", num: extraction.num, depart: extraction.departText, arrivee: extraction.arriveeText };
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
      browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      })
    const page = await browser.newPage()
    act_page = page;    await page.setViewport({ width: 1280, height: 800 })

    console.log("📡 Accès à la page cible...")
    await page.goto(AMC_URL, { waitUntil: "networkidle2" })

    let proofSent = false;

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
            
            await Promise.all([
                page.waitForNavigation({ waitUntil: "networkidle2", timeout: 20000 }).catch(() => {}),
                submitButton.evaluate((b: any) => b.click()),
            ]);
        } else {
            console.log("❌ ERREUR CATACLYSMIQUE : Impossible de localiser les IDs ctl00_Login, ctl00_Password ou ctl00_ValiderButton !");
        }
        
        await new Promise(r => setTimeout(r, 5000));
        continue
      }

      if (!page.url().includes("TransporteurAtraiter")) {
          console.log("⚠️ Redirection temporaire...")
          await new Promise(r => setTimeout(r, 5000))
          continue; 
      }

      const hasRienAtraiter = pageText.includes("Aucune donnée disponible dans le tableau") ||
                              pageText.includes("Aucun résultat");

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
                  console.log(`-> Push de la course history ${hist.num} (${hist.depart} -> ${hist.arrivee})`);
                  await saveLog("MANUAL_SUCCESS", acceptedBuffer, hist.depart, hist.arrivee, hist.num, hist.demandeur, hist.patient, hist.datePec, hist.heurePec);
              }
          }
      } catch(err) {
          console.error("❌ Erreur pendant le sync de l'historique :", err);
      }
      // --------------------------------------------------------

      if (!hasRienAtraiter) {
         console.log("🚨 ACTIVITÉ DÉTECTÉE SUR LE PRT !!")
         
         // Nouvelle logique : Screenshot TOUTE activité nouvelle (uniquement les courses non acceptées)
         try {
             const currentNums = await page.evaluate(() => {
                 const targetTable = document.querySelector('#AT_Affectation') || document;
                 const headers = Array.from(targetTable.querySelectorAll('th'));
                 const nIdx = headers.findIndex((th: any) => (th.innerText || "").trim().toLowerCase() === 'n°');
                 
                 return Array.from(targetTable.querySelectorAll('tr'))
                     .filter((tr: any) => tr.querySelector('input[type="image"][src*="valider"], img[src*="valider"], img[src*="check"], a[title*="accepter"]') !== null)
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
         } catch(e) {}

         const snipeResult = await snipeCourse(page, isFilterActive);
         
         if (snipeResult.status === "ignored") {
             console.log("⏭️ Les courses ne matchent pas Gonesse / Villes cibles. Reprise de la veille.");
             await new Promise(r => setTimeout(r, 8000));
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
                 await saveLog("MANUAL_PENDING", snipeResult.buffer, snipeResult.depart || "Inconnu", snipeResult.arrivee || "Inconnu", snipeResult.num || "Inconnu");
             }
             await new Promise(r => setTimeout(r, 8000));
         }
         else if (snipeResult.status === "failed_already_taken") {
             await page.goto(AMC_URL, { waitUntil: "networkidle2" });
             await new Promise(r => setTimeout(r, 15000));
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
         else {
             if (snipeResult.buffer) await sendTelegramAlert("⚠️ **COMPORTEMENT IMPRÉVU PENDANT LE SNIPING...**", snipeResult.buffer);
             await new Promise(r => setTimeout(r, 30000));
         }
      } else {
        const randomDelay = Math.floor(Math.random() * (20000 - 12000 + 1) + 12000)
        console.log(`[Attente] Repos du robot pendant ${Math.floor(randomDelay/1000)}s pour être discret...`)
        await new Promise(r => setTimeout(r, randomDelay))
        
        console.log(`[${new Date().toLocaleTimeString()}] Rafraîchissement de la page...`)
        try {
           await page.reload({ waitUntil: "networkidle2" })
        } catch(e){}
      }
    }

    } catch (error) {
      if (isBotDisconnected) {
          console.log("✅ Déconnexion volontaire accomplie, silence radio.");
          if (browser) { try { await browser.close() } catch(e){} }
          continue;
      }
      console.error("❌ ERREUR FATALE (Redémarrage dans 15s):", error)
      let crashBuffer = null;
      try {
          if (browser) {
              const pages = await browser.pages();
              if (pages.length > 0) crashBuffer = await pages[0].screenshot({ fullPage: true });
          }
      } catch(e) {}

      if (crashBuffer) {
          await sendTelegramAlert(`🔄 **CRASH RELAYÉ - REDÉMARRAGE AUTOMATIQUE** :\n\`${error}\`\n\n📸 **TRACE DU TABLEAU AVANT LE CRASH :**`, crashBuffer)
      } else {
          await sendTelegramAlert(`🔄 **CRASH RELAYÉ - REDÉMARRAGE AUTOMATIQUE** :\n\`${error}\``)
      }
      
      if (browser) {
          try { await browser.close() } catch(e){}
      }
      await new Promise(r => setTimeout(r, 15000))
    }
  }
}

startAgent()

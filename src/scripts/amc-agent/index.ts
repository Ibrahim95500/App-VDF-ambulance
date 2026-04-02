import puppeteer from "puppeteer"
import dotenv from "dotenv"
import path from "path"
import fs from "fs"
import TelegramBot from "node-telegram-bot-api"

// Configuration
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })
dotenv.config()

const AMC_USERNAME = process.env.AMC_USERNAME || process.env.AMC_ID || "VDF"
const AMC_PASSWORD = process.env.AMC_PASSWORD || "Jordan95500!" 
const AMC_URL = "https://transportpatient.fr/Transport/TransporteurAtraiter.aspx?ModuleID=24"

// Configuration Telegram Forcée pour BotPRTScrap (Mode Broadcast)
const TELEGRAM_BOT_TOKEN = "8648311380:AAGZA5FOqAJ1BE78o96RH4R1_eHCLxkAefs"
const TELEGRAM_CHAT_IDS = ["1634444351", "8679052160", "8457900796", "6171035866"] 

// Écouteur Interactif Telegram
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true })
const manualClicks = new Set<string>()
const alertedCourses = new Set<string>()

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

async function saveLog(status: string, buffer: Buffer | null, depart?: string, arrivee?: string, num?: string) {
    if (status === "ignored" || status === "unknown") return; 
    try {
        const formData = new FormData();
        formData.append("status", status);
        if (depart) formData.append("depart", depart);
        if (arrivee) formData.append("arrivee", arrivee);
        if (num) formData.append("num", num);
        
        if (buffer) {
            formData.append("image", new Blob([new Uint8Array(buffer)], { type: "image/png" }), "screenshot.png");
        }
        
        // Envoi au NextJS local qui a accès à sa propre base Docker isolée
        await fetch("http://localhost:8080/api/sniper", {
            method: "POST",
            body: formData
        });
    } catch(e) {
        console.error("❌ Erreur de transmission au Dashboard Web :", e);
    }
}

async function sendTelegramAlert(message: string, imageBuffer?: Buffer, courseId?: string) {
  if (!TELEGRAM_BOT_TOKEN || TELEGRAM_CHAT_IDS.length === 0) return
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`
  for (const chatId of TELEGRAM_CHAT_IDS) {
      try {
        if (imageBuffer) {
          const formData = new FormData()
          formData.append("chat_id", chatId)
          formData.append("photo", new Blob([new Uint8Array(imageBuffer)], { type: "image/png" }), "screenshot.png")
          formData.append("caption", message)
          formData.append("parse_mode", "Markdown")
          if (courseId) {
             formData.append("reply_markup", JSON.stringify({
                 inline_keyboard: [[{ text: "✅ Accepter MANUELLEMENT", callback_data: `ACCEPT_${courseId}` }]]
             }))
          }
          await fetch(url, { method: "POST", body: formData })
        } else {
          const textUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
          await fetch(textUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "Markdown" })
          })
        }
      } catch (err) {
        console.error(`❌ Erreur Telegram au chat ${chatId}:`, err)
      }
  }
}

async function snipeCourse(page: any): Promise<{ buffer: Buffer | null, status: string, num?: string, depart?: string, arrivee?: string }> {
    console.log("🎯 DÉBUT DU SNIPING ! Évaluation Chirurgicale des courses...")
    const manualClicksArray = Array.from(manualClicks);
    const alertedCoursesArray = Array.from(alertedCourses);
    
    // Étape 1: Évaluer les lignes du tableau et filtrer
    const extraction = await page.evaluate((manualIds: string[], alertedIds: string[]) => {
        const allowedArrivals = [
            "gonesse", "villiers le bel", "arnouville", "sarcelles", "garges", 
            "louvres", "goussainville", "fontenay", "bouqueval", "ecouen", 
            "roissy", "saint brice", "saint-brice", "le thillay", "puiseux", 
            "tremblay", "dugny", "bonneuil", "vemars", "bellefontaine", "fosses",
            "survilliers", "saint witz", "saint-witz", "luzarches", "chaumontel",
            "vilaine sous bois", "jagny sous bois"
        ];
        
        let result = { clicked: false, isManual: false, num: "", departText: "", arriveeText: "", foundNotVip: false, allNums: [] as string[] };
        
        const headers = Array.from(document.querySelectorAll('th'));
        const departIdx = headers.findIndex(th => th.innerText.toLowerCase().includes('départ'));
        const arriveeIdx = headers.findIndex(th => th.innerText.toLowerCase().includes('arrivée'));
        const nIdx = headers.findIndex(th => th.innerText.toLowerCase() === 'n°');
        
        const rows = document.querySelectorAll('tr');
        for (let row of rows) {
            const acceptBtn = row.querySelector('input[type="image"][src*="valider"], img[src*="valider"], img[src*="check"], a[title*="accepter"]');
            
            if (acceptBtn && departIdx >= 0 && arriveeIdx >= 0 && nIdx >= 0) {
                const tds = row.querySelectorAll('td');
                if (tds.length > Math.max(departIdx, arriveeIdx, nIdx)) {
                    result.departText = tds[departIdx].innerText.trim();
                    result.arriveeText = tds[arriveeIdx].innerText.trim();
                    result.num = tds[nIdx].innerText.trim();
                    result.allNums.push(result.num);
                    
                    const isGonesseDepart = result.departText.toLowerCase().includes('gonesse');
                    const isAllowedArrivee = allowedArrivals.some(city => result.arriveeText.toLowerCase().includes(city));
                    
                    const isVIP = isGonesseDepart && isAllowedArrivee;
                    const isManualTriggered = manualIds.includes(result.num);

                    if (isVIP || isManualTriggered) {
                        if (acceptBtn.tagName === 'IMG' && acceptBtn.parentElement && acceptBtn.parentElement.tagName === 'A') {
                            acceptBtn.parentElement.click();
                        } else {
                            (acceptBtn as HTMLElement).click();
                        }
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
    }, manualClicksArray, alertedCoursesArray);

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
        const timeMatch = bodyText.match(/souhait[eé]e.*?(\d{2}:\d{2})/i) || bodyText.match(/à\s*(\d{2}:\d{2})/i);
        let targetTime = "12:00"; 
        if (timeMatch && timeMatch[1]) {
            targetTime = timeMatch[1];
        }

        const getElByLabel = (txt: string, tag: string) => {
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
            let node;
            while (node = walker.nextNode()) {
                if (node.nodeValue && node.nodeValue.toLowerCase().includes(txt.toLowerCase())) {
                    const parent = node.parentElement;
                    if (parent && parent.getBoundingClientRect().width > 0) { 
                        let el = parent.nextElementSibling?.querySelector(tag) || parent.parentElement?.querySelector(tag);
                        if (el) return el;
                    }
                }
            }
            return null;
        };
        
        const timeInput = getElByLabel('Heure de PEC', 'input');
        if (timeInput) {
            (timeInput as HTMLInputElement).value = targetTime;
            timeInput.dispatchEvent(new Event('input', { bubbles: true }));
            timeInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        const chauffeurSel = getElByLabel('Chauffeur', 'select');
        const equipierSel = getElByLabel('Equipier', 'select');
        
        const setSelect = (sel: Element | null, query: string) => {
            if (!sel || !(sel instanceof HTMLSelectElement)) return;
            for (let i = 0; i < sel.options.length; i++) {
                if (sel.options[i].text.toLowerCase().includes(query.toLowerCase())) {
                    sel.selectedIndex = i;
                    sel.dispatchEvent(new Event('change', { bubbles: true }));
                    return;
                }
            }
            if (sel.options.length > 1) {
                sel.selectedIndex = 1;
                sel.dispatchEvent(new Event('change', { bubbles: true }));
            }
        };

        setSelect(chauffeurSel, 'AMBU VDF1');
        setSelect(equipierSel, 'AMBU VDF2');
        
        let buttons = Array.from(document.querySelectorAll('input[type="submit"], button, a, input[type="button"]'));
        let submitBtn = buttons.find(b => {
             let text = ((b as HTMLInputElement).value || b.textContent || (b as HTMLElement).innerText || '').toLowerCase();
             let val = b.getAttribute('value') || '';
             const rect = b.getBoundingClientRect();
             return rect.width > 0 && rect.height > 0 && (text.includes('valider') || val.toLowerCase().includes('valider'));
        });
        
        if (submitBtn) {
            // @ts-ignore
            if (submitBtn.tagName === 'A' && typeof __doPostBack === 'function' && submitBtn.id) {
                // @ts-ignore
                __doPostBack(submitBtn.id.replace(/_/g, '$'), '');
            } else {
                (submitBtn as HTMLElement).click();
            }
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
  let browser = null

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })
    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 800 })

    console.log("📡 Accès à la page cible...")
    await page.goto(AMC_URL, { waitUntil: "networkidle2" })

    let proofSent = false;

    console.log("⏳ Début de la boucle de surveillance (15s)...")
    while (true) {
      const pageText = await page.evaluate(() => document.body.innerText)

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

      if (!hasRienAtraiter) {
         console.log("🚨 ACTIVITÉ DÉTECTÉE SUR LE PRT !!")
         
         const snipeResult = await snipeCourse(page);
         
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
                 await saveLog("MANUAL_PENDING", snipeResult.buffer, snipeResult.depart, snipeResult.arrivee, snipeResult.num);
             }
             await new Promise(r => setTimeout(r, 5000));
         }
         else if (snipeResult.status === "failed_already_taken") {
             console.log("❌ ZUT ! Course déjà acceptée par un concurrent.");
             if (snipeResult.buffer) {
                 await sendTelegramAlert("🤬 **ARGH !! ON S'EST FAIT VOLER LA COURSE !**\nLe robot a tiré, la course était parfaite, mais une autre société de malades mentaux a cliqué 1 milliseconde avant nous ! Regarde l'écran de l'arbitre (erreur jaune).", snipeResult.buffer);
                 await saveLog("FAILED_ALREADY_TAKEN", snipeResult.buffer, snipeResult.depart, snipeResult.arrivee, snipeResult.num);
             }
             await page.goto(AMC_URL, { waitUntil: "networkidle2" });
             await new Promise(r => setTimeout(r, 15000));
         }
         else if (snipeResult.status === "SUCCESS") {
             if (snipeResult.buffer) {
                 await sendTelegramAlert("🎯 **MISSION ACCOMPLIE ! COURSE SNIPÉE (AUTO) !** 🚑💨\n- Heure PEC ajustée dynamiquement\n- VDF1 assigné (Chauffeur)\n- VDF2 assigné (Équipier)\nLa demande est à nous !", snipeResult.buffer);
                 await saveLog("SUCCESS", snipeResult.buffer, snipeResult.depart, snipeResult.arrivee, snipeResult.num);
             }
             await new Promise(r => setTimeout(r, 120000));
         }
         else if (snipeResult.status === "MANUAL_SUCCESS") {
             if (snipeResult.buffer) {
                 await sendTelegramAlert("🎯 **COURSE VALIDÉE MANUELLEMENT AVEC SUCCÈS !** 🚑💨\nC'est dans la poche !", snipeResult.buffer);
                 await saveLog("MANUAL_SUCCESS", snipeResult.buffer, snipeResult.depart, snipeResult.arrivee, snipeResult.num);
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
    console.error("❌ ERREUR FATALE:", error)
    await sendTelegramAlert(`❌ **CRASH AMC AGENT** :\n\`${error}\``)
    if (browser) await browser.close()
  }
}

startAgent()

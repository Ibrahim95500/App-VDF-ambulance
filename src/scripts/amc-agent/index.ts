import puppeteer from "puppeteer"
import dotenv from "dotenv"
import path from "path"

// Configuration
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })
dotenv.config()

const AMC_USERNAME = process.env.AMC_USERNAME || process.env.AMC_ID || "VDF"
const AMC_PASSWORD = process.env.AMC_PASSWORD || "Jordan95500!" // Récupéré de ton prompt !
const AMC_URL = "https://transportpatient.fr/Transport/TransporteurAtraiter.aspx?ModuleID=24"

// Configuration Telegram Forcée pour BotPRTScrap (Mode Broadcast)
const TELEGRAM_BOT_TOKEN = "8648311380:AAGZA5FOqAJ1BE78o96RH4R1_eHCLxkAefs"
const TELEGRAM_CHAT_IDS = ["1634444351", "8679052160", "8457900796"] // Ibrahim, VDF, Collègue

async function sendTelegramAlert(message: string, imageBuffer?: Buffer) {
  if (!TELEGRAM_BOT_TOKEN || TELEGRAM_CHAT_IDS.length === 0) {
    console.warn("⚠️ Telegram non configuré, alerte ignorée.")
    return
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`

  // On envoie le message/photo à TOUS les collaborateurs enregistrés
  for (const chatId of TELEGRAM_CHAT_IDS) {
      try {
        if (imageBuffer) {
          const formData = new FormData()
          formData.append("chat_id", chatId)
          formData.append("photo", new Blob([imageBuffer], { type: "image/png" }), "screenshot.png")
          formData.append("caption", message)
          formData.append("parse_mode", "Markdown")

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
        console.error(`❌ Erreur lors de l'envoi Telegram au chat ${chatId}:`, err)
      }
  }
}

// ============================================
// 🎯 FONCTION SNIPER : VALIDATION ÉCLAIR
// ============================================
async function snipeCourse(page: any): Promise<{ buffer: Buffer | null, status: string }> {
    console.log("🎯 DÉBUT DU SNIPING ! Évaluation Chirurgicale des courses...")
    
    // Étape 1: Évaluer les lignes du tableau et filtrer "Gonesse -> Villes autorisées"
    const clicked = await page.evaluate(() => {
        const allowedArrivals = [
            "gonesse", "villiers le bel", "arnouville", "sarcelles", "garges", 
            "louvres", "goussainville", "fontenay", "bouqueval", "ecouen", 
            "roissy", "saint brice", "saint-brice", "le thillay", "puiseux", 
            "tremblay", "dugny", "bonneuil"
        ];
        
        let didClick = false;
        
        // On récupère les colonnes du tableau
        const headers = Array.from(document.querySelectorAll('th'));
        const departIdx = headers.findIndex(th => th.innerText.toLowerCase().includes('départ'));
        const arriveeIdx = headers.findIndex(th => th.innerText.toLowerCase().includes('arrivée'));
        
        const rows = document.querySelectorAll('tr');
        for (let row of rows) {
            const acceptBtn = row.querySelector('input[type="image"][src*="valider"], img[src*="valider"], img[src*="check"], a[title*="accepter"]');
            
            if (acceptBtn && departIdx >= 0 && arriveeIdx >= 0) {
                const tds = row.querySelectorAll('td');
                if (tds.length > Math.max(departIdx, arriveeIdx)) {
                    const departText = tds[departIdx].innerText.toLowerCase();
                    const arriveeText = tds[arriveeIdx].innerText.toLowerCase();
                    
                    // RÈGLE MÉTIER STRICTE :
                    const isGonesseDepart = departText.includes('gonesse');
                    const isAllowedArrivee = allowedArrivals.some(city => arriveeText.includes(city));
                    
                    if (isGonesseDepart && isAllowedArrivee) {
                        // ON ACCEPTE !! Pêche à la ligne validée !
                        if (acceptBtn.tagName === 'IMG' && acceptBtn.parentElement && acceptBtn.parentElement.tagName === 'A') {
                            acceptBtn.parentElement.click();
                        } else {
                            (acceptBtn as HTMLElement).click();
                        }
                        didClick = true;
                        break; // On tire sur une seule course à la fois
                    }
                }
            }
        }
        return didClick;
    });

    if (!clicked) {
        console.log("❌ Aucune course ne respecte les conditions (Départ Gonesse vers notre Zone). On ignore.");
        return { buffer: null, status: "ignored" };
    }
    
    console.log("✅ Clic sur la course effectué ! Attente de l'ouverture du Pop-up AJAX...");
    
    // Étape 2: Attendre un court instant que le Pop-up Modal ASP.NET s'affiche
    await new Promise(r => setTimeout(r, 2000)); 
    
    // Étape 3: Analyser le pop-up, lire l'heure voulue, et remplir les champs
    console.log("🏎️ Paramétrage du pop-up (Heure, VDF1, VDF2) et Validation...");
    const validationClicked = await page.evaluate(() => {
        // --- A. Trouver l'heure désirée par le service ---
        const bodyText = document.body.innerText;
        // On cherche : "Heure de départ souhaitée par l'établissement : 14:00"
        const timeMatch = bodyText.match(/souhait[eé]e.*?(\d{2}:\d{2})/i) || bodyText.match(/à\s*(\d{2}:\d{2})/i);
        let targetTime = "12:00"; // Fallback si raté
        if (timeMatch && timeMatch[1]) {
            targetTime = timeMatch[1];
        }

        // Helper pour trouver un input/select basé sur un bout de texte proche (label)
        const getElByLabel = (txt: string, tag: string) => {
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
            let node;
            while (node = walker.nextNode()) {
                if (node.nodeValue && node.nodeValue.toLowerCase().includes(txt.toLowerCase())) {
                    const parent = node.parentElement;
                    if (parent && parent.getBoundingClientRect().width > 0) { // Visible
                        let el = parent.nextElementSibling?.querySelector(tag) || parent.parentElement?.querySelector(tag);
                        if (el) return el;
                    }
                }
            }
            return null;
        };
        
        // --- B. Remplir Heure de PEC ---
        const timeInput = getElByLabel('Heure de PEC', 'input');
        if (timeInput) {
            (timeInput as HTMLInputElement).value = targetTime;
            timeInput.dispatchEvent(new Event('input', { bubbles: true }));
            timeInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        // --- C. Remplir Chauffeur et Equipier ---
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
            // Fallback: 1er element utilisable
            if (sel.options.length > 1) {
                sel.selectedIndex = 1;
                sel.dispatchEvent(new Event('change', { bubbles: true }));
            }
        };

        // Règles métiers demandées par le chef (Termes exacts)
        setSelect(chauffeurSel, 'AMBU VDF1');
        setSelect(equipierSel, 'AMBU VDF2');
        
        // --- D. Cliquer sur le Bouton Vert Valider ---
        let buttons = Array.from(document.querySelectorAll('input[type="submit"], button, a, input[type="button"]'));
        let submitBtn = buttons.find(b => {
             let text = ((b as HTMLInputElement).value || b.textContent || b.innerText || '').toLowerCase();
             let val = b.getAttribute('value') || '';
             const rect = b.getBoundingClientRect();
             // Le bouton vert final visible dans le dom
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
        console.log("✅ Bouton 'Valider' final cliqué ! Attente de confirmation du serveur...");
        try {
            // On attend le rechargement de la page qui confirme
            await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 8000 });
        } catch(e) {}
    } else {
        console.log("⚠️ Le bouton final du Pop-up n'a pas été trouvé.");
    }
    
    // --- ÉTAPE 4 : Vérifier s'il y a l'erreur jaune "Demande déjà acceptée par une autre société" ---
    const finalBuffer = await page.screenshot({ fullPage: true }) as Buffer;
    const isError = await page.evaluate(() => document.body.innerText.includes("déjà acceptée"));
    
    if (isError) {
        return { buffer: finalBuffer, status: "failed_already_taken" };
    }
    return { buffer: finalBuffer, status: validationClicked ? "success" : "unknown" };
}

async function startAgent() {
  console.log("🚀 Lancement de l'Agent AMC (Espion)...")
  let browser: any = null;
  let page: any = null;
  let proofSent = false; // Variable pour éviter de spammer la preuve de connexion
  
  browser = await puppeteer.launch({
    headless: true, // Lancer en arrière-plan
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  })
  
  page = await browser.newPage()
  
  // Fake User Agent pour éviter les blocages de base
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  )

  try {
    // 1. Navigation Initiale
    console.log("📍 Accès à la page cible...")
    await page.goto(AMC_URL, { waitUntil: "networkidle2" })

    console.log("⏳ Début de la boucle de surveillance (15s)...")
    await sendTelegramAlert("👁️ L'Agent AMC (Espion) vient de démarrer la surveillance du PRT.")

    // 2. Boucle Principale
    while (true) {
      // Recharger la page si on est déjà supposément connecté
      if (!page.url().includes("Login")) {
        console.log(`[${new Date().toLocaleTimeString()}] Rafraîchissement de la page...`)
        try {
          await page.reload({ waitUntil: "networkidle2", timeout: 15000 })
        } catch(e) {
          console.log("Erreur de rafraichissement, on continue quand même.")
        }
      }
      
      // -- VÉRIFICATION SI DÉCONNECTÉ --
      const isLoginPage = (await page.$('input[type="password"]')) !== null
      
      if (isLoginPage) {
        console.log("🔒 Page de login détectée, authentification en cours...")
        
        // Petite pause stratégique avant d'agir
        console.log("Attente 3s que la page se stabilise...")
        await new Promise(r => setTimeout(r, 3000))
        
        console.log(`Frappe native des identifiants au clavier... User=${AMC_USERNAME}`)
        
        // On clique et on vide le champ au cas où
        await page.click('#ctl00_Login', { clickCount: 3 });
        await page.keyboard.press('Backspace');
        // On tape natifement, comme un humain (delay 50ms par touche)
        await page.type('#ctl00_Login', AMC_USERNAME, { delay: 50 });
        
        await page.click('#ctl00_Password', { clickCount: 3 });
        await page.keyboard.press('Backspace');
        await page.type('#ctl00_Password', AMC_PASSWORD, { delay: 50 });
        
        console.log("Clic asynchrone sur le bouton avec Puppeteer API...")
        // Au lieu d'injecter du code JS, on dit à Puppeteer de chercher et cliquer sur l'élément <a> exactement
        await page.evaluate(() => {
             const btn = document.getElementById('ctl00_ValiderButton');
             if(btn) btn.click();
        });
        
        await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => console.log("Navigation Ajax Catch"));
        
        // Redirection forcée vers la page Atraiter si ce n'est pas le cas
        if (!page.url().includes("TransporteurAtraiter")) {
           console.log("Redirection vers la page cible...");
           await page.goto(AMC_URL, { waitUntil: "networkidle2" }).catch(()=>console.log("Goto catch"));
        }
        continue; // On repart au début de la boucle pour un check propre
      }
      
      // --- 3. Analyse de la page UNIQUEMENT si on est sur la bonne page ---
      if (!page.url().includes("TransporteurAtraiter")) {
          console.log("⚠️ Nous ne sommes pas sur la page des courses à traiter. L'analyse est suspendue en attendant la redirection.");
          await new Promise(r => setTimeout(r, 5000));
          continue; // On retourne au début de la boucle pour retenter la connexion/redirection
      }
      
      const pageText = await page.evaluate(() => document.body.innerText)
      // La détection ultra stricte basée sur le texte
      const hasRienAtraiter = pageText.includes("Demandes en attente (0)") || 
                              pageText.includes("Aucune donnée disponible dans le tableau") ||
                              pageText.includes("Aucun résultat")

      // Envoi de la preuve si c'est la toute première fois
      if (!proofSent && page.url().includes("TransporteurAtraiter")) {
          console.log("📸 Prise de la capture de preuve de connexion...")
          const proofBuffer = await page.screenshot({ fullPage: true }) as Buffer
          await sendTelegramAlert("📸 **PREUVE DE CONNEXION**\nL'Agent est bien à l'intérieur ! Voici le tableau de chasse vide que je surveille :", proofBuffer)
          proofSent = true;
      }

      if (!hasRienAtraiter) {
         console.log("🚨 ACTIVITÉ DÉTECTÉE SUR LE PRT !!")
         
         // On lance le SNIPER
         const snipeResult = await snipeCourse(page);
         
         if (snipeResult.status === "ignored") {
             console.log("⏭️ Les courses ne matchent pas Gonesse / Villes cibles. Reprise de la veille.");
             await new Promise(r => setTimeout(r, 8000));
         } 
         else if (snipeResult.status === "failed_already_taken") {
             console.log("❌ ZUT ! Course déjà acceptée par un concurrent.");
             // On s'est fait avoir d'une milliseconde ! Message drôle pour le groupe
             if (snipeResult.buffer) {
                 await sendTelegramAlert("🤬 **ARGH !! ON S'EST FAIT VOLER LA COURSE !**\nLe robot a tiré, la course était parfaite, mais une autre société de malades mentaux a cliqué 1 milliseconde avant nous ! Regarde l'écran de l'arbitre (erreur jaune). On se vengera sur la prochaine ! 🏎️💨", snipeResult.buffer)
             }
             await page.goto(AMC_URL, { waitUntil: "networkidle2" });
             await new Promise(r => setTimeout(r, 15000));
         }
         else if (snipeResult.status === "success") {
             if (snipeResult.buffer) await sendTelegramAlert("🎯 **MISSION ACCOMPLIE ! COURSE SNIPÉE !** 🚑💨\n- Heure PEC ajustée dynamiquement\n- VDF1 assigné (Chauffeur)\n- VDF2 assigné (Équipier)\nLa demande est à nous ! Voici le tableau des scores :", snipeResult.buffer);
             // Attendre 2 minutes pour apprécier la victoire
             await new Promise(r => setTimeout(r, 120000));
         }
         else {
             if (snipeResult.buffer) await sendTelegramAlert("⚠️ **COMPORTEMENT IMPRÉVU PENDANT LE SNIPING...**\nLe robot a tenté de cliquer mais l'issue est incertaine. Veuillez vérifier manuellement ! 🚨", snipeResult.buffer);
             await new Promise(r => setTimeout(r, 30000));
         }
      } else {
        // 5. Pause Humaine Aléatoire (Anti-Détection)
        // Au lieu de 15s fixes, on fait entre 12s et 20s pour faire "humain"
        const randomDelay = Math.floor(Math.random() * (20000 - 12000 + 1) + 12000)
        console.log(`[Attente] Repos du robot pendant ${Math.floor(randomDelay/1000)}s pour être discret...`)
        await new Promise(r => setTimeout(r, randomDelay))
      }
    }

  } catch (error) {
    console.error("❌ ERREUR FATALE:", error)
    await sendTelegramAlert(`❌ **CRASH AMC AGENT** :\n\`${error}\``)
    if (browser) await browser.close()
  }
}

// Lancement automatique du processus
startAgent()

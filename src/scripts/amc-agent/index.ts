import puppeteer from "puppeteer"
import dotenv from "dotenv"
import path from "path"

// Configuration
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })
dotenv.config()

const AMC_USERNAME = process.env.AMC_USERNAME || process.env.AMC_ID || "VDF"
const AMC_PASSWORD = process.env.AMC_PASSWORD || "Jordan95500!" // Récupéré de ton prompt !
const AMC_URL = "https://transportpatient.fr/Transport/TransporteurAtraiter.aspx?ModuleID=24"

// Configuration Telegram Forcée pour BotPRTScrap
const TELEGRAM_BOT_TOKEN = "8648311380:AAGZA5FOqAJ1BE78o96RH4R1_eHCLxkAefs"
const TELEGRAM_CHAT_ID = "1634444351"

async function sendTelegramAlert(message: string, imageBuffer?: Buffer) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log("⚠️ Variables d'environnement Telegram manquantes. Alertes désactivées.")
    console.log("Message:", message)
    return
  }

  try {
    if (imageBuffer) {
      const formData = new FormData()
      formData.append("chat_id", TELEGRAM_CHAT_ID)
      formData.append("caption", message)
      formData.append("photo", new Blob([imageBuffer]), "screenshot.png")
      
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
        method: "POST",
        body: formData,
      })
      if (!response.ok) {
        console.error("Erreur Telegram:", await response.text())
      }
    } else {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message }),
      })
    }
  } catch (err) {
    console.error("Erreur d'envoi Telegram:", err)
  }
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
         // Il y a PEUT ÊTRE une course !
         console.log("🚨 ACTIVITÉ DÉTECTÉE SUR LE PRT !!")
         
         // On capture l'écran
         const buffer = await page.screenshot({ fullPage: true }) as Buffer
         
         // On extrait un peu de HTML pour comprendre comment cliquer la prochaine fois
         const htmlExtraction = await page.evaluate(() => {
           // On va chercher tous les boutons et inputs pour repérer les ID
           const interactables = Array.from(document.querySelectorAll('input[type="submit"], input[type="button"], button, a'))
             .filter(el => {
                const text = (el.textContent || (el as HTMLInputElement).value || "").toLowerCase()
                return text.includes("prendre") || text.includes("accepter") || text.includes("valider")
             })
             .map(el => ({
               tag: el.tagName,
               id: el.id,
               text: el.textContent || (el as HTMLInputElement).value,
               className: el.className
             }))
           return interactables
         })
         
         await sendTelegramAlert(
           `🚨 **COURSE DETECTÉE !!** 🚨\n\nL'espion a trouvé une course en attente.\nVoici le HTML des boutons trouves:\n\`\`\`json\n${JSON.stringify(htmlExtraction, null, 2)}\n\`\`\`\n\n*(Regardez la capture jointe)*`,
           buffer
         )
         
         // On fait une pause plus longue pour ne pas spammer telegram s'il la course reste là plusieurs minutes
         console.log("Pause de 2 minutes pour éviter le spam...")
         await new Promise(r => setTimeout(r, 120000)) 
         
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

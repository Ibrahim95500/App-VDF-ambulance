import puppeteer from "puppeteer"
import dotenv from "dotenv"
import path from "path"

// Configuration
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })
dotenv.config()

const AMC_USERNAME = process.env.AMC_USERNAME || process.env.AMC_ID || "VDF"
const AMC_PASSWORD = process.env.AMC_PASSWORD || "Jordan95500!" // Récupéré de ton prompt !
const AMC_URL = "https://transportpatient.fr/Transport/TransporteurAtraiter.aspx?ModuleID=24"

// Pour alerter sur Telegram
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID // ID du canal ou ton ID

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
  
  const browser = await puppeteer.launch({
    headless: true, // Lancer en arrière-plan
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  })
  
  const page = await browser.newPage()
  
  // Fake User Agent pour éviter les blocages de base
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  )

  try {
    // 1. Navigation Initiale et Login
    console.log("📍 Accès à la page cible...")
    await page.goto(AMC_URL, { waitUntil: "networkidle2" })
    
    // Vérifier si on est redirigé vers la page de login (ce qui est probable au premier accès)
    const isLoginPage = await page.$('input[type="password"]') !== null
    
    if (isLoginPage) {
      console.log("🔒 Page de login détectée, authentification en cours...")
      // IMPORTANT : Il faudra ajuster ces sélecteurs 'id' selon le vrai HTML de la page de login Atout Majeur
      const usernameInputDesc = 'input[id*="Login"], input[name*="Login"], input[id*="Utilisateur"], input[type="text"]'
      const passInputDesc = 'input[type="password"]'
      
      await page.waitForSelector(passInputDesc, { timeout: 5000 })
      
      const usernameInputs = await page.$$(usernameInputDesc)
      if (usernameInputs.length > 0) {
        await usernameInputs[0].type(AMC_USERNAME)
      }
      
      await page.type(passInputDesc, AMC_PASSWORD)
      
      // On cherche un bouton de type submit
      await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle2" }),
        page.click('input[type="submit"], button[type="submit"]')
      ])
      console.log("✅ Authentification réussie.")
    }

    // On s'assure qu'on est bien sur la page à traiter
    if (!page.url().includes("TransporteurAtraiter")) {
      await page.goto(AMC_URL, { waitUntil: "networkidle2" })
    }

    console.log("⏳ Début de la boucle de surveillance (15s)...")
    await sendTelegramAlert("👁️ L'Agent AMC (Espion) vient de démarrer la surveillance du PRT.")

    // 2. Boucle Principale
    while (true) {
      console.log(`[${new Date().toLocaleTimeString()}] Rafraîchissement de la page...`)
      
      // Recharger la page (ou on pourrait simuler un clic sur "Actualiser" si c'est de l'AJAX)
      await page.reload({ waitUntil: "networkidle2" })
      
      // 3. Analyse de la page
      // On cherche des mots-clés typiques ou on analyse le tableau.
      // Hypothèse : S'il y a une course, il y a un bouton avec "Accepter", "Prendre", ou on trouve des dates.
      // Comme on ne connait pas le HTML, on va vérifier le contenu global
      
      const pageText = await page.evaluate(() => document.body.innerText)
      const hasRienAtraiter = pageText.includes("Auncun transport à traiter") || 
                              pageText.includes("Aucun résultat") || 
                              pageText.includes("0 course")

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
        // Rien, on attend 15 secondes
        await new Promise(r => setTimeout(r, 15000))
      }
    }

  } catch (error) {
    console.error("❌ ERREUR FATALE:", error)
    await sendTelegramAlert(`❌ **CRASH AMC AGENT** :\n\`${error}\``)
    await browser.close()
  }
}

// Lancement automatique du processus
startAgent()

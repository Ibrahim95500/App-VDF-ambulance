import { chromium } from "playwright";
import path from "path";

async function generatePDF() {
    const filePath = "file://" + path.resolve(__dirname, "Guide_Installation_VDF.html");
    const outputPath = path.resolve(__dirname, "Guide_Installation_VDF.pdf");
    
    console.log("Démarrage de Playwright pour générer le PDF...");
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    await page.goto(filePath, { waitUntil: 'networkidle' });
    
    // Hide the "Imprimer" button for the PDF
    await page.evaluate(() => {
        const noPrintElements = document.querySelectorAll('.no-print');
        noPrintElements.forEach((el: any) => el.style.display = 'none');
    });

    await page.pdf({
        path: outputPath,
        format: 'A4',
        printBackground: true,
        margin: {
            top: "20px",
            bottom: "20px",
            left: "20px",
            right: "20px"
        }
    });

    await browser.close();
    console.log("✅ PDF généré avec succès dans : " + outputPath);
}

generatePDF().catch(console.error);

const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>Facture DigitAgency - VDF Ambulance</title>
    <style>
      body {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        color: #333;
        line-height: 1.6;
        margin: 0;
        padding: 40px;
        background-color: #fff;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 2px solid #2563eb;
        padding-bottom: 20px;
        margin-bottom: 40px;
      }
      .company-details h1 {
        color: #2563eb;
        margin: 0 0 5px 0;
        font-size: 32px;
        font-weight: 800;
      }
      .company-details p, .client-details p {
        margin: 2px 0;
        color: #555;
        font-size: 14px;
      }
      .invoice-title {
        text-align: right;
      }
      .invoice-title h2 {
        color: #1e293b;
        margin: 0 0 5px 0;
        font-size: 28px;
        text-transform: uppercase;
      }
      .invoice-title p {
        margin: 2px 0;
        font-size: 14px;
        color: #64748b;
      }
      .client-section {
        margin-bottom: 40px;
      }
      .client-title {
        font-weight: bold;
        color: #64748b;
        text-transform: uppercase;
        font-size: 12px;
        margin-bottom: 5px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 40px;
      }
      th {
        background-color: #f8fafc;
        color: #475569;
        font-weight: bold;
        text-align: left;
        padding: 12px;
        border-top: 1px solid #e2e8f0;
        border-bottom: 2px solid #cbd5e1;
      }
      td {
        padding: 15px 12px;
        border-bottom: 1px solid #e2e8f0;
        vertical-align: top;
      }
      .desc-title {
        font-weight: 600;
        color: #1e293b;
        margin: 0 0 5px 0;
        font-size: 15px;
      }
      .desc-text {
        font-size: 13px;
        color: #64748b;
        margin: 0;
      }
      .amountCol {
        text-align: right;
        font-weight: 600;
        color: #1e293b;
        white-space: nowrap;
      }
      .totals {
        width: 50%;
        float: right;
      }
      .totals-row {
        display: flex;
        justify-content: space-between;
        padding: 10px 0;
        border-bottom: 1px solid #e2e8f0;
      }
      .totals-row.final {
        border-bottom: none;
        font-size: 20px;
        font-weight: bold;
        color: #2563eb;
        padding-top: 15px;
      }
      .totals-row.already-paid {
        color: #10b981;
        font-weight: 600;
      }
      .footer {
        clear: both;
        margin-top: 80px;
        padding-top: 20px;
        border-top: 1px solid #e2e8f0;
        text-align: center;
        font-size: 12px;
        color: #94a3b8;
      }
      .clearfix::after {
        content: "";
        clear: both;
        display: table;
      }
    </style>
  </head>
  <body>

    <div class="header">
      <div class="company-details">
        <h1>DigitAgency</h1>
        <p>Expertise et Solutions Digitales</p>
        <p>Email: contact@digitagency.fr</p>
      </div>
      <div class="invoice-title">
        <h2>FACTURE</h2>
        <p><strong>Facture N° :</strong> INV-2026-0409</p>
        <p><strong>Date :</strong> 9 Avril 2026</p>
      </div>
    </div>

    <div class="client-section">
      <div class="client-title">Facturé à :</div>
      <div class="client-details">
        <p style="font-size:18px; font-weight: bold; color: #1e293b;">VDF Ambulance</p>
        <p>Direction et Exploitation</p>
        <p>Secteur 95 / Île-de-France</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description de la prestation</th>
          <th style="text-align: center;">Qté</th>
          <th class="amountCol">Montant (EUR)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <h3 class="desc-title">1. Plateforme Web Complète (Dashboard Administratif & RH)</h3>
            <p class="desc-text">- Espace de gestion des planning, acomptes et collaborateurs.<br/>- Système d'Authentification Sécurisé (Roles: ADMIN, RH, REGULATEUR, SALARIE).</p>
          </td>
          <td style="text-align: center;">1</td>
          <td class="amountCol">--</td>
        </tr>
        <tr>
          <td>
            <h3 class="desc-title">2. Application Mobile (iOS + Android)</h3>
            <p class="desc-text">- Export Natif iOS pour TestFlight et App Store.<br/>- Export Android (.apk).<br/>- Intégration Push Notifications (APNs & Google FCM).</p>
          </td>
          <td style="text-align: center;">1</td>
          <td class="amountCol">--</td>
        </tr>
        <tr>
          <td>
            <h3 class="desc-title">3. Écosystème Bots Telegram & Automatisation</h3>
            <p class="desc-text">- <strong>Bot Sniper PRT (Atout Majeur Concept)</strong> : Moteur de scraping haute fréquence, algorithme de filtrage VIP (Codes postaux autorisés) et validation automatique sous milliseconde.<br/>- <strong>Bot Relais & Support</strong> : Interface de commandes interactives et backup d'assignation d'urgence.</p>
          </td>
          <td style="text-align: center;">2</td>
          <td class="amountCol">--</td>
        </tr>
        <tr>
          <td>
            <h3 class="desc-title">4. DevOps, Serveur & Base de données</h3>
            <p class="desc-text">- Mise en place Docker (Containers).<br/>- Création réseau Base de Données PostgreSQL.<br/>- Gestion clés de sécurité et monitoring de performance PM2.</p>
          </td>
          <td style="text-align: center;">1</td>
          <td class="amountCol">--</td>
        </tr>
        <tr>
          <td>
            <h3 class="desc-title">5. Support, Formation & Maintenance</h3>
            <p class="desc-text">- Accompagnement des utilisateurs (Administrateurs & Ambulanciers).<br/>- Processus d'installation sur terminaux mobiles.<br/>- Maintenance corrective, gestion des incidents serveur et M.A.J.</p>
          </td>
          <td style="text-align: center;">1</td>
          <td class="amountCol">--</td>
        </tr>
      </tbody>
    </table>

    <div class="clearfix">
      <div class="totals">
        <div class="totals-row">
          <span>Sous-total (Prestation Globale Forfaitaire)</span>
          <span class="amountCol">2 500,00 €</span>
        </div>
        <div class="totals-row already-paid">
          <span>Acompte déjà versé</span>
          <span class="amountCol">- 1 300,00 €</span>
        </div>
        <div class="totals-row final">
          <span>Solde Restant Dû</span>
          <span class="amountCol">1 200,00 €</span>
        </div>
      </div>
    </div>

    <div class="footer">
      Merci pour votre confiance.<br/>
      Pour toute question concernant cette facture, veuillez contacter l'agence DigitAgency.
    </div>

  </body>
  </html>
  `;

  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  await page.pdf({ path: 'Facture_DigitAgency_VDF.pdf', format: 'A4', printBackground: true });
  await browser.close();
})();

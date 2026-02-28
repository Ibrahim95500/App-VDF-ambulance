/**
 * Utility to generate branded HTML emails for VDF Ambulance.
 * Includes logo, blue/orange branding, and professional signature.
 */

interface EmailTemplateOptions {
  title: string;
  preheader?: string;
  content: string; // HTML content
  footerNote?: string;
  actionUrl?: string;
  actionText?: string;
}

export function getBrandedEmailHtml({
  title,
  preheader = "",
  content,
  footerNote = "Ceci est un message automatique, merci de ne pas y répondre directement.",
  actionUrl,
  actionText
}: EmailTemplateOptions): string {
  // SVG logo hosted as a static file (transparent background - no white box issue)
  // Gmail blocks data URIs, so we use a real URL to the SVG file
  const logoUrl = 'https://dev.vdf-ambulance.fr/brand/logo-email.svg';
  const primaryColor = "#2c3e8a"; // VDF Blue
  const accentColor = "#f97316";  // VDF Orange

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f7f9; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e1e8ed; }
    .header { background-color: ${primaryColor}; padding: 40px 20px 30px; text-align: center; }
    .content { padding: 40px 30px; }
    .title { color: ${primaryColor}; font-size: 24px; font-weight: bold; margin-bottom: 20px; margin-top: 0; border-bottom: 2px solid ${accentColor}; display: inline-block; padding-bottom: 5px; }
    .text { font-size: 16px; color: #4b5563; margin-bottom: 25px; }
    .button-container { text-align: center; margin: 30px 0; }
    .button { background-color: ${primaryColor}; color: #ffffff !important; padding: 12px 25px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; }
    .signature { margin-top: 40px; padding-top: 20px; border-top: 1px solid #edf2f7; color: #718096; font-size: 14px; }
    .signature-name { font-weight: bold; color: ${primaryColor}; font-size: 16px; margin-bottom: 4px; }
    .footer { background-color: #f8fafc; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#fff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden">${preheader}</div>
  <div class="container">
    <div class="header">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
                <td align="center">
                    <img src="${logoUrl}" alt="VDF Ambulance" width="110" height="110" style="display: block; width: 110px; height: 110px; margin: 0 auto;">
                </td>
            </tr>
            <tr>
                <td align="center" style="padding-top: 10px;">
                    <div style="color: #ffffff; font-size: 13px; font-weight: bold; letter-spacing: 5px; text-transform: uppercase; font-family: Arial, sans-serif;">VDF AMBULANCE</div>
                </td>
            </tr>
        </table>
    </div>
    <div class="content">
      <h1 class="title">${title}</h1>
      <div class="text">
        ${content}
      </div>
      
      ${actionUrl && actionText ? `
      <div class="button-container">
        <a href="${actionUrl}" class="button">${actionText}</a>
      </div>
      ` : ''}

      <div class="signature">
        <p>Cordialement,</p>
        <div class="signature-name">Hamid Cheikh</div>
        <div>Directeur Général - VDF Ambulance</div>
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} VDF Ambulance. Tous droits réservés.</p>
      <p>${footerNote}</p>
    </div>
  </div>
</body>
</html>
  `;
}

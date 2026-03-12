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
  signatureHtml?: string;
}

export function getBrandedEmailHtml({
  title,
  preheader = "",
  content,
  footerNote = "Ceci est un message automatique, merci de ne pas y répondre directement.",
  actionUrl,
  actionText,
  signatureHtml = `
        <table border="0" cellspacing="0" cellpadding="0" style="margin-top: 15px;">
            <tr>
                <td style="padding-right: 15px; border-right: 2px solid #2c3e8a;">
                    <img src="cid:logo_vdf_footer" alt="VDF" width="60" height="40" style="display: block; width: 60px; height: auto;">
                </td>
                <td style="padding-left: 15px;">
                    <div style="font-weight: bold; color: #2c3e8a; font-size: 16px; margin-bottom: 2px;">Hamid Cheikh</div>
                    <div style="font-size: 13px; color: #718096; font-weight: 500;">Directeur Général</div>
                    <div style="font-size: 12px; color: #94a3b8;">VDF Ambulance</div>
                </td>
            </tr>
        </table>
  `
}: EmailTemplateOptions): string {
  const logoHeaderUrl = 'cid:logo_vdf_header'; 
  const primaryColor = "#2c3e8a"; // VDF Blue
  const accentColor = "#f97316";  // VDF Orange
  const backgroundColor = "#f4f7f9";

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: ${backgroundColor};">
  <div style="display:none;font-size:1px;color:#fff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden">${preheader}</div>
  
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: ${backgroundColor}; padding: 20px 0;">
    <tr>
      <td align="center">
        <!--[if mso]>
        <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
        <tr>
        <td align="center" valign="top" width="600">
        <![endif]-->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #e1e8ed;">
          <!-- HEADER -->
          <tr>
            <td align="center" style="background-color: ${primaryColor}; padding: 45px 20px 35px;">
                <img src="${logoHeaderUrl}" alt="VDF Ambulance" width="120" height="auto" style="display: block; width: 120px; height: auto; margin: 0 auto; max-width: 120px;">
                <div style="color: #ffffff; font-size: 11px; font-weight: bold; letter-spacing: 6px; text-transform: uppercase; font-family: Arial, sans-serif; margin-top: 20px;">VDF AMBULANCE</div>
            </td>
          </tr>
          
          <!-- CONTENT -->
          <tr>
            <td style="padding: 45px 35px;">
              <h1 style="color: ${primaryColor}; font-size: 24px; font-weight: bold; margin-bottom: 25px; margin-top: 0; border-bottom: 3px solid ${accentColor}; display: inline-block; padding-bottom: 8px;">${title}</h1>
              
              <div style="font-size: 16px; color: #4b5563; margin-bottom: 25px;">
                ${content}
              </div>
              
              ${actionUrl && actionText ? `
              <div style="text-align: center; margin: 40px 0;">
                <a href="${actionUrl}" style="background-color: ${primaryColor}; color: #ffffff !important; padding: 15px 35px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(44, 62, 138, 0.2);">${actionText}</a>
              </div>
              ` : ''}

              <!-- SIGNATURE -->
              <div style="margin-top: 45px; padding-top: 25px; border-top: 1px solid #edf2f7;">
                <p style="margin-bottom: 10px; color: #718096; font-size: 14px;">Cordialement,</p>
                ${signatureHtml}
              </div>
            </td>
          </tr>
          
          <!-- FOOTER -->
          <tr>
            <td style="background-color: #f8fafc; padding: 25px; text-align: center; color: #94a3b8; font-size: 11px; border-top: 1px solid #edf2f7;">
              <p style="margin: 0 0 8px 0;">© ${new Date().getFullYear()} VDF Ambulance. Tous droits réservés.</p>
              <p style="margin: 0; font-style: italic;">${footerNote}</p>
            </td>
          </tr>
        </table>
        <!--[if mso]>
        </td>
        </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

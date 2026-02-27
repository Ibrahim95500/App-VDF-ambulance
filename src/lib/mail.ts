import nodemailer from "nodemailer";
import { getBrandedEmailHtml } from "./email-templates";

/**
 * Get SMTP Transporter
 */
async function getTransporter() {
    console.log("--- MAIL-TRACE: Building transporter config ---");
    console.log(`Host: ${process.env.EMAIL_SERVER_HOST}, Port: ${process.env.EMAIL_SERVER_PORT}, User: ${process.env.EMAIL_SERVER_USER ? 'SET' : 'NOT SET'}`);

    const smtpConfig = {
        host: process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com',
        port: Number(process.env.EMAIL_SERVER_PORT) || 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_SERVER_USER,
            pass: process.env.EMAIL_SERVER_PASSWORD,
        }
    };

    const transporter = nodemailer.createTransport(smtpConfig as any);
    return transporter;
}

interface SendBrandedEmailProps {
    to: string;
    subject: string;
    title: string;
    preheader: string;
    content: string;
    actionUrl?: string;
    actionText?: string;
}

export async function sendBrandedEmail({
    to,
    subject,
    title,
    preheader,
    content,
    actionUrl,
    actionText
}: SendBrandedEmailProps) {
    console.log(`--- MAIL-TRACE: Attempting to send email ---`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);

    try {
        console.log(`--- MAIL-TRACE: Getting transporter ---`);
        const transporter = await getTransporter();
        console.log(`--- MAIL-TRACE: Transporter obtained ---`);

        console.log(`--- MAIL-TRACE: Generating HTML ---`);
        const html = getBrandedEmailHtml({
            title,
            preheader,
            content,
            actionUrl,
            actionText
        });
        console.log(`--- MAIL-TRACE: HTML generated (length: ${html.length}) ---`);

        const mailOptions = {
            from: process.env.EMAIL_FROM || "noreply@vdf-ambulance.fr",
            to,
            subject,
            html
        };

        console.log(`--- MAIL-TRACE: Calling transporter.sendMail ---`);
        const info = await transporter.sendMail(mailOptions);
        console.log(`--- MAIL-TRACE: sendMail SUCCESS ---`);
        console.log(`Message ID: ${info.messageId}`);
        console.log(`Response: ${info.response}`);

        return { success: true };
    } catch (error) {
        console.error("--- MAIL-TRACE: sendBrandedEmail FAILED ---");
        console.error(error);
        return { success: false, error };
    }
}

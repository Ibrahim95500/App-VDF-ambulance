import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendBrandedEmail } from "@/lib/mail";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const tickets = await prisma.supportTicket.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(tickets);
    } catch (error) {
        return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const body = await req.json();
        const { subject, description, urgency, category, pageUrl, imageUrl } = body;

        if (!subject || !description || !urgency || !category) {
            return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
        }

        // Créer le ticket
        const ticket = await prisma.supportTicket.create({
            data: {
                userId: session.user.id,
                subject,
                description,
                urgency,
                category,
                pageUrl,
                imageUrl
            },
            include: { user: true }
        });

        // Trouver les admins pour le Bcc
        const admins = await prisma.user.findMany({
            where: {
                roles: { has: "ADMIN" },
                email: { not: null }
            },
            select: { email: true }
        });
        
        // On récupère les emails des admins et on s'assure que ce sont des strings valides.
        const adminEmails = admins.map(a => a.email).filter(e => typeof e === 'string' && e.trim().length > 0) as string[];
        const bccString = adminEmails.length > 0 ? adminEmails.join(',') : undefined;

        const roleStr = (session.user as any)?.roles?.join(', ') || 'SALARIE';

        // Envoyer l'email
        const emailContent = `
            <div style="font-family: Arial, sans-serif;">
                <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 15px; margin-bottom: 20px;">
                    <p style="margin:0 0 5px 0;"><strong>👤 Demandeur :</strong> ${ticket.user.firstName} ${ticket.user.lastName} (${roleStr})</p>
                    <p style="margin:0;"><strong>📧 Contact :</strong> <a href="mailto:${ticket.user.email}" style="color: #3b82f6;">${ticket.user.email}</a></p>
                </div>
                
                <p><strong>Sujet:</strong> <span style="color:#2563eb; font-weight:bold;">${subject}</span></p>
                <p><strong>Urgence:</strong> <span style="background:#fee2e2; color:#b91c1c; padding:2px 6px; border-radius:4px; font-weight:bold;">${urgency}</span></p>
                <p><strong>Catégorie:</strong> ${category}</p>
                <p><strong>URL de la page:</strong> <a href="${pageUrl}">${pageUrl || 'Non communiquée'}</a></p>
                
                <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                
                <h3 style="color:#111827;">Description de l'incident :</h3>
                <div style="background-color:#f3f4f6; padding:15px; border-radius:8px; white-space:pre-wrap; color:#374151;">${description}</div>
                
                ${imageUrl ? `<div style="margin-top:20px; padding:10px; border:2px dashed #d1d5db; border-radius:8px; text-align:center;">
                    <p style="color:#6b7280; font-weight:bold;">📸 Capture d'écran jointe</p>
                    <img src="${imageUrl}" alt="Capture de l'incident" style="max-width:100%; border-radius:4px; margin-top:10px;" />
                </div>` : `<p style="color:#9ca3af; font-size:12px; margin-top:10px;">Aucune capture d'écran fournie.</p>`}
            </div>
        `;

        await sendBrandedEmail({
            to: "digitagency.nifa@gmail.com",
            bcc: bccString,
            replyTo: ticket.user.email,
            subject: `[VDF IT - ${urgency}] ${subject.substring(0, 40)}...`,
            title: "Alerte Incident Informatique",
            preheader: `Un nouvel incident a été déclaré par ${ticket.user.firstName}.`,
            content: emailContent,
            actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://vdf-ambulance.fr'}/dashboard/it`,
            actionText: "Ouvrir le Tableau de Bord IT"
        });

        return NextResponse.json({ success: true, ticket });
    } catch (error) {
        console.error("API Support Error:", error);
        return NextResponse.json({ error: "Erreur lors de la création du ticket" }, { status: 500 });
    }
}

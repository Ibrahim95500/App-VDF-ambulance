import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";
import { sendBrandedEmail } from "@/lib/mail";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const status = formData.get("status") as string;
        const depart = formData.get("depart") as string;
        const arrivee = formData.get("arrivee") as string;
        const num = formData.get("num") as string;
        const demandeur = formData.get("demandeur") as string;
        const patient = formData.get("patient") as string;
        const datePec = formData.get("datePec") as string;
        const heurePec = formData.get("heurePec") as string;
        const file = formData.get("image") as File | null;

        if (num) {
            const existing = await prisma.sniperLog.findFirst({
                where: { num }
            });
            if (existing) {
                console.log(`Course AMC N°${num} ignorée: Déjà en base.`);
                return NextResponse.json({ success: true, skipped: true, message: "Déjà en base" });
            }
        }

        let imageUrl = null;
        if (file) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const filename = `${Date.now()}_${num || 'course'}.png`;
            const publicDir = path.join(process.cwd(), 'public', 'uploads', 'sniper');
            if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
            fs.writeFileSync(path.join(publicDir, filename), buffer);
            imageUrl = `/uploads/sniper/${filename}`;
        }

        await prisma.sniperLog.create({
            data: {
                num: num || null,
                demandeur: demandeur || null,
                patient: patient || null,
                depart: depart || "Inconnu",
                arrivee: arrivee || "Inconnu",
                status: status,
                imageUrl: imageUrl,
                datePec: datePec || new Date().toLocaleDateString('fr-FR'),
                heurePec: heurePec || new Date().toLocaleTimeString('fr-FR')
            }
        });

        // Envoi Email dès la récupération
        try {
            await sendBrandedEmail({
                to: "prisederendezvousvdf@gmail.com",
                subject: `🚑 VDF-AMC | Nouvelle Course Détectée (N° ${num || 'Inconnu'}) - ${status}`,
                title: "Nouveau Trophée AMC !",
                preheader: `Départ: ${depart || 'Inconnu'} ➔ Arrivée: ${arrivee || 'Inconnu'}`,
                content: `
                    <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin-top: 15px;">
                        <h2 style="color: #0f172a; margin-top:0;">Détails de la demande</h2>
                        <ul style="list-style-type: none; padding-left: 0; margin-bottom: 0;">
                            <li style="margin-bottom: 8px;"><strong>N° :</strong> ${num || "-"}</li>
                            <li style="margin-bottom: 8px;"><strong>Date RDV :</strong> ${datePec || "-"} à ${heurePec || "-"}</li>
                            <li style="margin-bottom: 8px;"><strong>Patient :</strong> ${patient || "-"}</li>
                            <li style="margin-bottom: 8px;"><strong>Demandeur :</strong> ${demandeur || "-"}</li>
                            <li style="margin-bottom: 8px;"><strong>Départ :</strong> <span style="color: #10b981;">${depart || "-"}</span></li>
                            <li style="margin-bottom: 8px;"><strong>Arrivée :</strong> <span style="color: #3b82f6;">${arrivee || "-"}</span></li>
                            <li><strong>Statut du Robot :</strong> ${status}</li>
                        </ul>
                    </div>
                `,
                actionUrl: num ? `https://transportpatient.fr/Transport/ImpDemande.aspx?IDDemande=${num}` : undefined,
                actionText: "Voir sur Atout Majeur Concept"
            });
            console.log("Email Sniper envoyé avec succès à prisederendezvousvdf@gmail.com");
        } catch (mailErr) {
            console.error("Erreur d'envoi d'email Sniper:", mailErr);
            // On ne bloque pas la réponse pour l'app
        }

        return NextResponse.json({ success: true });
    } catch(e) {
        console.error("Erreur API Sniper:", e);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}

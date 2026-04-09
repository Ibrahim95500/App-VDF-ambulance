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
                if (patient && !existing.patient) {
                     console.log(`[API Sniper] Course ${num} mise à jour avec le patient: ${patient}`);
                     await prisma.sniperLog.update({
                         where: { id: existing.id },
                         data: { 
                             patient, 
                             demandeur: demandeur || existing.demandeur, 
                             datePec: datePec || existing.datePec, 
                             heurePec: heurePec || existing.heurePec 
                         }
                     });
                     return NextResponse.json({ success: true, message: "Mis à jour avec infos patient" });
                }
                
                console.log(`Course AMC N°${num} ignorée: Déjà en base avec toutes les infos.`);
                return NextResponse.json({ success: true, skipped: true, message: "Déjà en base" });
            }
        }

        let imageUrl = null;
        let attachmentObj = null;
        if (file) {
            const buffer = Buffer.from(await file.arrayBuffer());
            
            // Convert to Base64 to avoid Docker / Next.js static asset caching issues
            const base64String = buffer.toString("base64");
            imageUrl = `data:image/png;base64,${base64String}`;
            
            attachmentObj = {
                filename: `Course_${num || 'AMC'}.png`,
                content: buffer // NodeJS Buffer for nodemailer
            };
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
                attachments: attachmentObj ? [attachmentObj] : undefined
            });
            console.log("Email Sniper envoyé avec succès à prisederendezvousvdf@gmail.com");
        } catch (mailErr) {
            console.error("Erreur d'envoi d'email Sniper:", mailErr);
            // On ne bloque pas la réponse pour l'app
        }

        // --- ENVOI NOTIFICATION PUSH ---
        try {
            const { sendPushNotification } = await import("@/actions/web-push.actions");
            const targetUsers = await prisma.user.findMany({
                where: {
                    roles: {
                        hasSome: ["ADMIN", "REGULATEUR"]
                    }
                }
            });

            const emoji = status.toLowerCase().includes("succès") ? "✅" : "👀";
            
            const pushPromises = targetUsers.map(user => 
                sendPushNotification(
                    user.id,
                    `${emoji} PRT : Course ${status}`,
                    `Départ: ${depart || '?'}\n(À vérifier aussi sur PRT)`,
                    "/dashboard/rh/sniper-logs"
                )
            );

            await Promise.allSettled(pushPromises);
            console.log(`[PUSH_DEBUG] Notifications envoyées à ${targetUsers.length} Admins/Regulateurs pour la course PRT.`);
        } catch (pushErr) {
            console.error("Erreur d'envoi Push Sniper:", pushErr);
        }

        return NextResponse.json({ success: true });
    } catch(e) {
        console.error("Erreur API Sniper:", e);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}

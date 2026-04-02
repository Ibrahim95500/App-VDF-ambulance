import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";

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

        return NextResponse.json({ success: true });
    } catch(e) {
        console.error("Erreur API Sniper:", e);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}

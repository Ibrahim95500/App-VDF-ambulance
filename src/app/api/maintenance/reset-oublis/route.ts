import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get('secret');

        // Validation de sécurité (même secret que le CRON)
        if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        console.log("[MAINTENANCE] Remise à zéro globale des compteurs d'oublis...");
        
        const result = await prisma.user.updateMany({
            data: {
                oubliCount: 0
            }
        });

        return NextResponse.json({ 
            success: true, 
            message: `Compteurs réinitialisés pour ${result.count} utilisateurs.`,
            count: result.count 
        });
    } catch (error) {
        console.error("[MAINTENANCE] Erreur reset oublis:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

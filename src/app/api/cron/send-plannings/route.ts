import { NextResponse } from "next/server";
import { sendPlanningsToEmployees } from "@/actions/regulation-process.actions";
import { format, addDays } from "date-fns";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get('secret');
        const dateParam = searchParams.get('date');

        // Validation de sécurité
        if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // On gère la date (par défaut DEMAIN à Paris)
        const nowParis = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Paris" }));
        const tomorrow = addDays(nowParis, 1);
        const dateStr = dateParam ? dateParam : format(tomorrow, 'yyyy-MM-dd');

        console.log(`[CRON 19H] Envoi automatique des plannings pour le ${dateStr}`);
        const result = await sendPlanningsToEmployees(dateStr);

        if (result.success) {
            return NextResponse.json({ success: true, message: result.message });
        } else {
            return NextResponse.json({ success: false, error: result.error }, { status: 500 });
        }
    } catch (error) {
        console.error("[CRON 19H] Erreur critique:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

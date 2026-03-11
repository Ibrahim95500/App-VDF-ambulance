import { NextResponse } from "next/server";
import { checkConfirmationsAndPenalize } from "@/actions/regulation-process.actions";
import { format, addDays } from "date-fns";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get('secret');

        // Validation de sécurité
        if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // On gère la date de DEMAIN (planning qui devait être validé)
        const tomorrow = addDays(new Date(), 1);
        const dateStr = format(tomorrow, 'yyyy-MM-dd');

        console.log(`[CRON 21H] Vérification automatiques des validations pour le ${dateStr}`);
        const result = await checkConfirmationsAndPenalize(dateStr);

        if (result.success) {
            return NextResponse.json({ success: true, message: result.message });
        } else {
            return NextResponse.json({ success: false, error: result.error }, { status: 500 });
        }
    } catch (error) {
        console.error("[CRON 21H] Erreur critique:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteSniperLog(id: string) {
    try {
        await prisma.sniperLog.delete({ where: { id } });
        revalidatePath("/dashboard/rh/sniper-logs");
        return { success: true };
    } catch (e) {
        console.error("Erreur suppression log:", e);
        return { success: false, error: "Impossible de supprimer la cible" };
    }
}

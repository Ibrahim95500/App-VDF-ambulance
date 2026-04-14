"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateTicketStatus(ticketId: string, status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED", adminComment?: string) {
    try {
        await prisma.supportTicket.update({
            where: { id: ticketId },
            data: { 
                status,
                ...(adminComment !== undefined && { adminComment })
            }
        });
        
        revalidatePath('/dashboard/it');
        return { success: true };
    } catch (e) {
        console.error("IT Action Error:", e);
        return { error: "Erreur lors de la mise à jour." };
    }
}

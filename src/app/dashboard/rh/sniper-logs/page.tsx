import prisma from "@/lib/prisma"
import { SniperLogClient } from "./client"

export default async function SniperLogsPage() {
    const logs = await prisma.sniperLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 200
    });
    
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Historique du Bot Sniper 🎯</h2>
                    <p className="text-muted-foreground">Registre des activités du robot (courses automatiques et manuelles).</p>
                </div>
            </div>
            <SniperLogClient data={logs} />
        </div>
    )
}

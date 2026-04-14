import prisma from "@/lib/prisma"
import { SniperLogClient } from "./client"

export const dynamic = 'force-dynamic';

export default async function SniperLogsPage() {
    try {
        const logs = await prisma.sniperLog.findMany({
            orderBy: { createdAt: "desc" },
            take: 200
        });
        
        return (
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">PRT Suivi 🎯</h2>
                        <p className="text-muted-foreground">Registre des activités du robot (courses automatiques et manuelles).</p>
                    </div>
                </div>
                <SniperLogClient data={logs} />
            </div>
        )
    } catch (e: any) {
        return (
            <div className="p-8">
                <h1 className="text-red-500 text-2xl font-bold mb-4">CRASH SERVEUR !</h1>
                <pre className="bg-black text-green-400 p-4 rounded overflow-auto whitespace-pre-wrap">{e.stack || String(e)}</pre>
            </div>
        )
    }
}

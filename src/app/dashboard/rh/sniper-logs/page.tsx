import prisma from "@/lib/prisma"
import { SniperLogClient } from "./client"

export const dynamic = 'force-dynamic';

export default async function SniperLogsPage() {
    const logs = await prisma.sniperLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 200
    });
    
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <SniperLogClient data={logs} />
        </div>
    )
}

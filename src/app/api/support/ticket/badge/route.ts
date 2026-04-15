import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ hasUnreadResolved: false });
        }

        const roles = (session.user as any).roles || [];
        const isITAdmin = roles.includes("SERVICE_IT") || roles.includes("ADMIN");

        let count = 0;

        if (isITAdmin) {
            count = await prisma.supportTicket.count({
                where: { status: { in: ["OPEN", "IN_PROGRESS"] } }
            });
        } else {
            count = await prisma.supportTicket.count({
                where: {
                    userId: session.user.id,
                    status: { in: ["RESOLVED", "IN_PROGRESS"] }
                }
            });
        }

        return NextResponse.json({ hasUnreadResolved: count > 0, count });
    } catch (error) {
        return NextResponse.json({ hasUnreadResolved: false, count: 0 });
    }
}

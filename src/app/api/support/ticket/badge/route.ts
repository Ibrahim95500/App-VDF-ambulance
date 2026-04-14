import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ hasUnreadResolved: false });
        }

        const count = await prisma.supportTicket.count({
            where: {
                userId: session.user.id,
                status: "RESOLVED"
            }
        });

        return NextResponse.json({ hasUnreadResolved: count > 0 });
    } catch (error) {
        return NextResponse.json({ hasUnreadResolved: false });
    }
}

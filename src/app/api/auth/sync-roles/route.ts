import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth();

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: {
                roles: true,
                isRegulateur: true,
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            roles: user.roles,
            isRegulateur: user.isRegulateur,
        });
    } catch (error) {
        console.error("Error syncing roles:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
        return new NextResponse("Missing ID", { status: 400 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id },
            select: { image: true }
        });

        if (!user || !user.image) {
            return new NextResponse("Not Found", { status: 404 });
        }

        // If it's a base64 string, parse it
        if (user.image.startsWith("data:image")) {
            const [header, base64Data] = user.image.split(",");
            const contentType = header.split(";")[0].split(":")[1];
            const buffer = Buffer.from(base64Data, "base64");

            return new NextResponse(buffer, {
                headers: {
                    "Content-Type": contentType,
                    "Cache-Control": "public, max-age=3600",
                },
            });
        }

        // Fallback for non-base64 images (if any)
        return NextResponse.redirect(user.image);
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 });
    }
}

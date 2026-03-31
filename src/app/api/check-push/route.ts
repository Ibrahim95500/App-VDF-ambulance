import { NextResponse } from 'next/server';
import { prisma as db } from '@/lib/prisma';

export async function GET() {
    try {
        const tokens = await db.fcmToken.findMany({
            include: { user: { select: { email: true } } }
        });
        
        const webSubs = await db.pushSubscription.findMany({
            include: { user: { select: { email: true } } }
        });

        return NextResponse.json({
            status: "ok",
            timestamp: new Date().toISOString(),
            fcmTokens: tokens.map((t: any) => ({
                email: t.user?.email,
                tokenPreview: t.token,
                createdAt: t.createdAt
            })),
            webPushSubs: webSubs.map((s: any) => ({
                email: s.user?.email,
                endpoint: s.endpoint.substring(0, 20) + '...'
            }))
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

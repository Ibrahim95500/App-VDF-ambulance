const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log("Checking FCM Tokens...");
    const tokens = await prisma.fcmToken.findMany({
        include: { user: { select: { email: true, role: true } } }
    });
    console.log(`Found ${tokens.length} FCM tokens in Database:`);
    tokens.forEach(t => console.log(`- User: ${t.user?.email} | Token: ${t.token?.substring(0, 15)}... | Date: ${t.createdAt}`));

    console.log("\nChecking Web Push Subscriptions...");
    const subs = await prisma.pushSubscription.findMany({
        include: { user: { select: { email: true } } }
    });
    console.log(`Found ${subs.length} Web push subs.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

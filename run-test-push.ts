import { sendPushNotification } from './src/actions/web-push.actions';
import { prisma as db } from './src/lib/prisma';

async function testPush() {
    try {
        console.log("Fetching local DB tokens...");
        const tokens = await db.fcmToken.findMany({
            where: { userEmail: 'ibrahim.nifa01@gmail.com' },
            orderBy: { createdAt: 'desc' }
        });
        
        if (tokens.length === 0) {
            console.log("No FCM Tokens in Local DB found.");
            process.exit(1);
        }
        
        console.log(`Found ${tokens.length} tokens. Top token: ${tokens[0].token.substring(0, 20)}...`);
        console.log("Attempting to send push direct via local Firebase Admin...");
        
        await sendPushNotification(
            "ibrahim.nifa01@gmail.com", 
            "Test Local", 
            "Ceci est déclenché par le terminal du Mac !"
        );
        
        console.log("SEND METHOD COMPLETED WITHOUT EXCEPTION");
    } catch(e) {
        console.error("FIREBASE ADMIN EXCEPTION:", e);
    } finally {
        await db.$disconnect();
    }
}

testPush();

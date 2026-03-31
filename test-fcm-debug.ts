import { db, admin } from './src/lib/db';

async function test() {
  try {
    const tokensFromDb = await db.fcmToken.findMany({
      where: { userEmail: 'ibrahim.nifa01@gmail.com' },
      orderBy: { createdAt: 'desc' }
    });
    
    if (tokensFromDb.length === 0) {
      console.log('No true FCM tokens found in DB for ibrahim.nifa01@gmail.com');
      process.exit(1);
    }
    
    // Test the 2 most recent tokens just to be absolutely sure
    for (let i = 0; i < Math.min(2, tokensFromDb.length); i++) {
        const token = tokensFromDb[i].token;
        console.log(`\nTesting token ${i+1}:`, token.substring(0, 30) + '...');
        
        const message = {
          token: token,
          notification: {
            title: "Test VDF",
            body: "Ceci est un test direct."
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
                badge: 1,
                alert: {
                  title: "Test VDF (APNS)",
                  body: "Ceci est un test APNS."
                }
              }
            }
          }
        };
        
        try {
            const response = await admin.messaging().send(message);
            console.log("🎉 SUCCESS FROM FIREBASE:", response);
        } catch(e) {
            console.error("🔥 FB ERROR:", e.errorInfo || e);
        }
    }
  } catch(e) {
    console.error("🔥 GLOBAL ERROR:", e);
  } finally {
    await db.$disconnect();
  }
}

test();

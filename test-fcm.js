const { PrismaClient } = require('@prisma/client');
const admin = require('firebase-admin');
const serviceAccount = require('./android/app/google-services.json');

const db = new PrismaClient();

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

async function run() {
  const tokens = await db.fcmToken.findMany({
    where: { userEmail: 'ibrahim.nifa01@gmail.com' },
    orderBy: { createdAt: 'desc' },
    take: 3
  });

  console.log(`Found ${tokens.length} tokens for user.`);
  for (const t of tokens) {
    console.log(`Testing token: ${t.tokenPreview} (Created: ${t.createdAt})`);
    try {
      const res = await admin.messaging().send({
        token: t.token,
        notification: { title: "Test", body: "Direct test from script" },
        apns: { payload: { aps: { sound: 'default', badge: 1 } } }
      });
      console.log(`SUCCESS: ${res}`);
    } catch (e) {
      console.error(`FAILED: ${e.message}`);
    }
  }
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });

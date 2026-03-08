import admin from 'firebase-admin';

export const getFcm = () => {
    if (!admin.apps.length) {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY;

        if (projectId && clientEmail && privateKey) {
            try {
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId,
                        clientEmail,
                        privateKey: privateKey.replace(/\\n/g, '\n'),
                    }),
                });
            } catch (error) {
                console.error('Firebase admin initialization error', error);
                return null;
            }
        } else {
            return null;
        }
    }
    return admin.messaging();
};
